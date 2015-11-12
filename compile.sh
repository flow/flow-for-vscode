#!/bin/bash

# Nuclide uses some non-standard babel options that interfere with
# transpilation.
rm -f ./node_modules/nuclide-flow-base/.babelrc

# This is a horrible hack that is necessary because Nuclide doesn't transpile
# FlowService.js since it serves as an RPC definition file. We should figure out
# a long-term solution but for now, this works.
echo "Transpiling nuclide-flow-base"
babel ./node_modules/nuclide-flow-base/lib/FlowService.js > ./node_modules/nuclide-flow-base/lib/FlowService-transpiled.js
# This works out because transpilation converges to a fixed point.
mv ./node_modules/nuclide-flow-base/lib/FlowService-transpiled.js ./node_modules/nuclide-flow-base/lib/FlowService.js

echo "Starting watch"
babel ./lib --watch --out-dir=./build --source-maps
