
WEBPACK_CLI ?= ./node_modules/.bin/webpack-cli
API_EXTRACTOR ?= ./node_modules/.bin/api-extractor


.PHONY:test
test:
	make -C test test


.PHONY:single-test
single-test:
	make -C test single-test

.PHONY:verify-explicit-stdlib
verify-explicit-stdlib:
	make -C test verify-explicit-stdlib

.PHONY:verify-valid-test-contracts
verify-valid-test-contracts:
	make -C test verify-valid-test-contracts



.PHONY:build-release
build-release: build-lib-release build-cli-release

.PHONY:build-dev
build-dev: build-lib-dev build-cli-dev



.PHONY:build-lib-release
build-lib-release: clean-build-lib
	$(WEBPACK_CLI) --config=webpack.config-lib.js --mode=production
	$(MAKE) post-build-lib

.PHONY:build-lib-dev
build-lib-dev: clean-build-lib
	$(WEBPACK_CLI) --config=webpack.config-lib.js --mode=development
	$(MAKE) post-build-lib



.PHONY:build-cli-release
build-cli-release:
	$(WEBPACK_CLI) --config=webpack.config-cli.js --mode=production
	$(MAKE) add-shell-prefix-to-aesophia-parser-js
	chmod u+x bin/aesophia-parser.js

.PHONY:build-cli-dev
build-cli-dev:
	$(WEBPACK_CLI) --config=webpack.config-cli.js --mode=development
	$(MAKE) add-shell-prefix-to-aesophia-parser-js
	chmod u+x bin/aesophia-parser.js



#
# Didn't get sed to add \n correctly on macOS, thus this brute force approach
.PHONY:add-shell-prefix-to-aesophia-parser-js
add-shell-prefix-to-aesophia-parser-js:
	echo "#!/usr/bin/env node" | cat - ./bin/aesophia-parser.js > ./bin/tmp.js
	cp ./bin/tmp.js ./bin/aesophia-parser.js
	rm ./bin/tmp.js



.PHONY:clean-build-lib
clean-build-lib:
	rm -rf dist

.PHONY:clean-build-cli
clean-build-cli:
	rm -rf bin


.PHONY:post-build-lib
post-build-lib:
	- mkdir ./etc
	$(API_EXTRACTOR) run --local --verbose
	ls dist/*.d.ts | grep -v aesophia-parser\.d\.ts  | xargs rm
	mv dist/aesophia-parser.d.ts dist/index.d.ts
	rm dist/tsdoc-metadata.json
	rm -rf dist/test
	rm -rf dist/src



.PHONY:run
run:
	node dist/index.js

.PHONY:clean
clean:
	rm -rf dist



.PHONY:deps
deps:
	npm install

###############################################################################
# NPM stuff
#

.PHONY:build-and-publish-npm
build-and-publish-npm:
	$(MAKE) build-npm
	$(MAKE) publish-npm

.PHONY:build-npm
build-npm:
	$(MAKE) test
	$(MAKE) build-release
	$(MAKE) verify-explicit-stdlib
	$(MAKE) verify-valid-test-contracts


.PHONY:publish-npm
publish-npm:
	npm publish

.PHONY:publish-npm-dry-run
publish-npm-dry-run:
	npm publish --dry-run


###############################################################################
# vscode plugin development

.PHONY:dev-build-local-vscode-deploy
dev-build-local-vscode-deploy:
	$(MAKE) build
	make -C ../aesophia-vscode reinstall-local-aesophia-parser


test-cli:
	./bin/aesophia-parser.js test/contracts/identity.aes

