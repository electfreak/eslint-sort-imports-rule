"use strict";

const rule = require("./sort-imports"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
    parser: require.resolve("@typescript-eslint/parser"),
});

ruleTester.run("sort-imports", rule, {
    valid: [
        {
            code: `/* comment 1 */\n/* comment 2 */\nimport fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path';`,
        },
        {
            code: "import {selectDeliveryDate} from '../../selectors';\n\nimport type {ExperimentFlag} from '.';",
        },
        {
            code: "import {selectDeliveryDate} from '../../selectors';\n\nimport type {ExperimentFlag} from '.';\nimport {calcDeliveryDate} from './helpers';",
        },
        {
            code: `import { ClientBus, subscribe } from "@yandex-nirvana/bus";\n\nimport { call } from "typed-redux-saga";`,
        },
        {
            code: `import { ClientBus, subscribe } from "@yandex-nirvana/bus";\n\nimport { call } from "typed-redux-saga";\n\nimport {selectDeliveryDate} from '../../selectors';\n\nimport {calcDeliveryDate} from './helpers';`,
        },
        {
            code: `import { call } from "typed-redux-saga";\n\nimport { pluralize } from "../../../../lib/utils";`,
        },
        {
            code: `import fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path';\n\nconst dynamic = import("my-dynamic-import");`,
        },
        {
            code: `import {defaultConfig} from "@shri2023/config";\n\nimport _ from 'lodash';\n\nimport {pluralize} from "../../../../lib/utils";\n\nimport {calcDeliveryDate} from './helpers';`,
        },
        {
            code: `import {serviceSlug} from "@abc";\nimport {solutions} from "@shri2023/solutions";\nimport {hermione} from "@yandex";`,
        },
        {
            code: `// This module is imported for commons good
            import * as lodash from "lodash";\n\nimport {relative} from "../../relative-package";`,
        },
        {
            code: `/**\n* This module is imported\n* for commons good\n*/\nimport * as lodash from "lodash";\n\nimport {relative} from "../../relative-package";`,
        },
        {
            code: `import * as lodash from "lodash";\n\n// This module is imported for commons good\n// This module is imported for commons good\n// This module is imported for commons good\nimport {relative} from "../../relative-package";`,
        },
        {
            code: `import fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path'; 
            
            if(true) {
              const dynamic = import("my-dynamic-import");
              const dynamic2 = import("my-dynamic-import2");
            }`,
        },
    ],

    invalid: [
        {
            code: "import fs from 'fs';\nimport _ from 'lodash';\n\nimport path from 'path';",
            errors: [{ message: "Imports are not in the right order" }],
            output: `import fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path';\n\n`,
        },
        {
            code: `import type {ExperimentFlag} from '.';\nimport {selectDeliveryDate} from '../../selectors';`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import {selectDeliveryDate} from '../../selectors';\n\nimport type {ExperimentFlag} from '.';\n\n`,
        },
        {
            code: `import {selectDeliveryDate} from '../../selectors';\nimport {calcDeliveryDate} from './helpers';\nimport type {ExperimentFlag} from '.';`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import {selectDeliveryDate} from '../../selectors';\n\nimport type {ExperimentFlag} from '.';\nimport {calcDeliveryDate} from './helpers';\n\n`,
        },
        {
            code: `import { call } from "typed-redux-saga";\nimport { ClientBus, subscribe } from "@yandex-nirvana/bus";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import { ClientBus, subscribe } from "@yandex-nirvana/bus";\n\nimport { call } from "typed-redux-saga";\n\n`,
        },
        {
            code: `import { pluralize } from "../../../../lib/utils";\n\nimport { call } from "typed-redux-saga";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import { call } from "typed-redux-saga";\n\nimport { pluralize } from "../../../../lib/utils";\n\n`,
        },
        {
            code: `import fs from 'fs';
            const dynamic = import("my-dynamic-import");
            import _ from 'lodash';
            import path from 'path';`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path';\n\nconst dynamic = import("my-dynamic-import");\n\n`,
        },
        {
            code: `import {pluralize} from "../../../../lib/utils";
            import {calcDeliveryDate} from './helpers';
            import {defaultConfig} from "@shri2023/config";
            import _ from 'lodash';`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import {defaultConfig} from "@shri2023/config";\n\nimport _ from 'lodash';\n\nimport {pluralize} from "../../../../lib/utils";\n\nimport {calcDeliveryDate} from './helpers';\n\n`,
        },
        {
            code: `import {hermione} from "@yandex";
            import {solutions} from "@shri2023/solutions";
            import {serviceSlug} from "@abc";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import {serviceSlug} from "@abc";\nimport {solutions} from "@shri2023/solutions";\nimport {hermione} from "@yandex";\n\n`,
        },

        {
            code: `import {relative} from "../../relative-package";

            // This module is imported for commons good
            import * as lodash from "lodash";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `// This module is imported for commons good\nimport * as lodash from "lodash";\n\nimport {relative} from "../../relative-package";\n\n`,
        },
        {
            code: `import {relative} from "../../relative-package";\n\n/**\n* This module is imported\n* for commons good\n*/\nimport * as lodash from "lodash";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `/**\n* This module is imported\n* for commons good\n*/\nimport * as lodash from "lodash";\n\nimport {relative} from "../../relative-package";\n\n`,
        },
        {
            code: `// This module is imported for commons good
            // This module is imported for commons good
            // This module is imported for commons good
            import {relative} from "../../relative-package";
            import * as lodash from "lodash";`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import * as lodash from "lodash";\n\n// This module is imported for commons good\n// This module is imported for commons good\n// This module is imported for commons good\nimport {relative} from "../../relative-package";\n\n`,
        },
        {
            code: `import _ from 'lodash';\n\nimport fs from 'fs';\n\nimport path from 'path';\n\nif(true) {\n  const dynamic = import("my-dynamic-import");\n  const dynamic2 = import("my-dynamic-import2");\n}\n`,
            errors: [{ message: "Imports are not in the right order" }],
            output: `import fs from 'fs';\nimport _ from 'lodash';\nimport path from 'path';\n\nif(true) {\n  const dynamic = import("my-dynamic-import");\n  const dynamic2 = import("my-dynamic-import2");\n}\n`,
        },
    ],
});
