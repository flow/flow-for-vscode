#!/bin/bash

echo "Transpiling ./lib"
babel ./lib --out-dir=./build --source-maps $@
