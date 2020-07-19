MOCHA ?= ../node_modules/.bin/mocha
AESOPHIA_PARASER_JS ?= ../bin/aesophia-parser.js



test:
	$(MOCHA) -r ts-node/register ./**/*-test.ts

single-test:
	$(MOCHA) -r ts-node/register \
		-g "expr-list-comprehension guard 1" \
		./**/*-test.ts



# FIXME: Verify all explicit stdlib
.PHONY:verify-explicit-stdlib
verify-explicit-stdlib: \
	../stdlib/Frac.aesj \
	../stdlib/Func.aesj \
	../stdlib/List.aesj \
	../stdlib/ListInternal.aesj \
	../stdlib/Option.aesj \
	../stdlib/Pair.aesj \
	../stdlib/Triple.aesj

.PHONY:verify-valid-test-contracts
verify-valid-test-contracts: \
	../test/contracts/identity.aesj \
	../test/contracts/counter.aesj \
	../test/contracts/factorial.aesj \
	../test/contracts/complex_types.aesj \
	../test/contracts/fundme.aesj \
	../test/contracts/list_comp.aesj


%.aesj : %.aes
	 $(AESOPHIA_PARASER_JS)  $<

