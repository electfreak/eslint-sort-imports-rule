"use strict";

/**
 * Node from AST. Could not do it (type) better.
 * @typedef {Object} ASTNode
 */

/**
 * Import with it's comments.
 * @typedef {Object} Import
 * @property {ASTNode} node
 * @property {Object[]} commentsBefore
 */

/**
 * Sorted imports.
 * @typedef {Import[][]} SortedImports
 */

/**
 * This callback is used for breaking imports to different groups.
 * @callback groupFilterCb
 * @param {string} value – import's path.
 * @returns {boolean}
 */

/**
 * @type {groupFilterCb[]}
 */
const groupFilterCbs = [
    (value) => value.startsWith("@"), // scoped
    (value) => !value.startsWith("@") && !value.startsWith("."), // npm
    (value) => value.startsWith(".."), // relative, not to the current folder
    (value) => value.startsWith(".") && !value.startsWith(".."), // relative to the current folder
];

/**
 * Checks if AST Nodes are in AST in the same order as in the arguments (b right after a).
 * @param {ASTNode} a
 * @param {ASTNode} b
 * @param {string} text – full text of source code.
 * @returns {boolean}
 */
const areNodesFollowing = (a, b, text) => {
    return a.range[1] + 1 === b.range[0] && text[a.range[1]] === "\n";
};

/**
 * Checks if imports are in AST in the same order as in the arguments (b right after a).
 * @param {Import} a
 * @param {Import} b
 * @param {string} text – full text of source code.
 * @returns {boolean}
 */
const areImportsFollowing = (a, b, text) => {
    if (b.commentsBefore.length > 0) {
        return areNodesFollowing(a.node, b.commentsBefore[0], text);
    }

    return areNodesFollowing(a.node, b.node, text);
};

/**
 * Checks if AST Nodes are separated by new line in source code.
 * @param {ASTNode} a
 * @param {ASTNode} b
 * @param {string} text – full text of source code.
 * @returns {boolean}
 */
const areNodesSeparatedByNewline = (a, b, text) => {
    return (
        a.range[1] + 2 === b.range[0] &&
        text[a.range[1]] === "\n" &&
        text[a.range[1] + 1] === "\n"
    );
};

/**
 * Checks if imports are separated by new line in source code w.r.t. comments.
 * @param {Import} a
 * @param {Import} b
 * @param {string} text – full text of source code.
 * @returns {boolean}
 */
const areImportsSeparatedByNewLine = (a, b, text) => {
    if (b.commentsBefore.length > 0) {
        return areNodesSeparatedByNewline(a.node, b.commentsBefore[0], text);
    }

    return areNodesSeparatedByNewline(a.node, b.node, text);
};

/**
 * Checks if imports sorted or not.
 * @param {SortedImports} orderedImports
 * @param {string} text – full text of source code.
 * @returns {boolean}
 */
const areImportsOrdered = (orderedImports, text) => {
    if (orderedImports.length > 1) {
        for (let i = 0; i < orderedImports.length - 1; ++i) {
            const [last] = orderedImports[i].slice(-1),
                first = orderedImports[i + 1][0];

            if (!areImportsSeparatedByNewLine(last, first, text)) {
                return false;
            }
        }
    }

    for (const group of orderedImports) {
        if (group.length < 2) {
            continue;
        }

        for (let i = 0; i < group.length - 1; ++i) {
            if (!areImportsFollowing(group[i], group[i + 1], text)) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Gives fixes aimed to remove node or token's element from source code w.r.t. trailing spaces, tabs, line feeds.
 * @param {*} nodeOrToken
 * @param {*} fixer
 * @param {*} text – full text of source code.
 * @returns {*[]} array of fixing objects.
 */
const removeNodeTrailing = (nodeOrToken, fixer, text) => {
    let fixes = [];
    let [s, e] = nodeOrToken.range;
    while (
        e < text.length &&
        (text[e] === " " || ["\n", " ", "\t"].includes(text[e]))
    ) {
        ++e;
    }

    fixes.push(fixer.removeRange([s, e]));
    return fixes;
};

/**
 *
 * @param {Import[][]} sortedImports
 * @param {*} fixer
 * @param {string} text
 * @returns {*[]} array of fixing objects.
 */
const fixImportsOrder = (sortedImports, fixer, text) => {
    const fixes = [];

    /* remove all imports w.r.t. comments from source code */
    sortedImports.forEach((group) =>
        group.forEach((imp) => {
            fixes.push(...removeNodeTrailing(imp.node, fixer, text));
            imp.commentsBefore.forEach((comm) =>
                fixes.push(...removeNodeTrailing(comm, fixer, text))
            );
        })
    );

    /* insert all imports in right order */
    const texts = getImportsTexts(sortedImports, text);
    let allImportsText = texts.map((group) => group.join("\n")).join("\n\n");
    if (allImportsText !== "") {
        allImportsText += "\n\n";
    }
        
    fixes.push(fixer.insertTextAfterRange([0, 0], allImportsText));

    return fixes;
};

/**
 * Extracts single imports' text from source code w.r.t. comments.
 * @param {Import} imp
 * @param {string} text
 * @returns {string[][]}
 */
const getImportText = (imp, text) => {
    let comms = imp.commentsBefore
        .map((comm) => text.slice(...comm.range))
        .join("\n");
    if (comms !== "") {
        comms += "\n";
    }

    const impText = text.slice(...imp.node.range);

    return comms + impText;
};

/**
 * Converts 2-d array of imports to 2-d array of it's texts.
 * @param {Import[][]} imports
 * @param {string} text
 * @returns {string[][]}
 */
const getImportsTexts = (imports, text) => {
    return imports.map((group) => group.map((imp) => getImportText(imp, text)));
};

module.exports = {
    meta: {
        type: "suggestion",
        fixable: "code",
    },

    create(context) {
        const importNodes = [];

        const getImportWithComments = (node) => ({
            node,
            commentsBefore: context.sourceCode.getCommentsBefore(node),
        });

        /**
         * Sorts imports.
         * @param {ASTNode[]} imports
         * @returns {Import[][]}
         */
        const getOrderedImports = (imports) => {
            const sorted = [];

            const staticImports = imports.filter(
                ({ type }) => type === "ImportDeclaration"
            );

            const dynamicImports = imports.filter(
                ({ type }) => type === "VariableDeclaration"
            );

            const staticCmp = (a, b) =>
                a.source.value.localeCompare(b.source.value);

            for (let groupFilter of groupFilterCbs) {
                sorted.push(
                    staticImports
                        .filter(({ source: { value } }) => groupFilter(value))
                        .sort(staticCmp)
                );
            }

            const dynamicCmp = (a, b) =>
                a.declarations[0].init.source.value.localeCompare(
                    b.declarations[0].init.source.value
                );

            sorted.push(dynamicImports.sort(dynamicCmp));

            return sorted
                .map((group) => group.map(getImportWithComments))
                .filter((group) => group.length > 0);
        };

        return {
            ImportDeclaration(node) {
                importNodes.push(node);
            },

            "Program > VariableDeclaration > VariableDeclarator > ImportExpression"(
                node
            ) {
                importNodes.push(node.parent.parent);
            },

            "Program:exit"(node) {
                const ordered = getOrderedImports(importNodes);
                if (!areImportsOrdered(ordered, context.sourceCode.text)) {
                    context.report({
                        node,
                        message: "Imports are not in the right order",
                        fix(fixer) {
                            return fixImportsOrder(
                                ordered,
                                fixer,
                                context.sourceCode.text
                            );
                        },
                    });
                }
            },
        };
    },
};
