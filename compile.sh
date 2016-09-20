#!/bin/bash

echo "Transpiling ./lib"
node_modules/.bin/babel ./lib --out-dir=./build --source-maps $@
