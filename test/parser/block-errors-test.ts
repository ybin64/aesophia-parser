import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'

describe('block errors', () => {

    it.skip('simple block error 1', () =>{
/*

$ aecli compiler compile 

---
contract Simple1 =
type t = int
---

<compiler error 1>
  <compiler erro #1>
    Message _________________________________________ Unexpected indentation. Probable causes:
  - something is missing in the previous statement, or
  - this line should be indented more.

    <pos>
      Col ___________________________________________ 1
      Line __________________________________________ 2
    </pos>
    Type ____________________________________________ parse_error
  </compiler erro #1>
</compiler error>

*/

        const result = tp.parseRuleErrorsNoAstLocation('top-decl', 
`
contract Simple1 =
type t = int
`)

        assert.equal(result.errors.length, 1)
        assert.deepStrictEqual([{
            withLoc : {
                location : {
                    begin : {
                        line : 3,
                        column : 1
                    },
                    end : {
                        line   : 3,
                        column : 4
                    }
                },
                message : 'Unexpected indentation'
            }

        }], tp.removeLocationOffsetFromErrors(result.errors))
    })

    it('no block error with aecli, but is this really valid?', () => {
        const result = tp.parseRuleErrorsNoAstLocation('top-decl', 
`
contract Simple1 = type t = int
`)       

        assert.equal(result.errors.length , 0)
    })


    it('simple block error', () => {


/*

$ aecli compiler compile 

---
contract Simple1 =
  type t = 
  int
---

<compiler error 1>
  <compiler erro #1>
    Message _________________________________________ Unexpected indentation. Probable causes:
  - something is missing in the previous statement, or
  - this line should be indented more.

    <pos>
      Col ___________________________________________ 3
      Line __________________________________________ 3
    </pos>
    Type ____________________________________________ parse_error
  </compiler erro #1>
</compiler error>
 
*/

    const result = tp.parseRuleErrorsNoAstLocation('top-decl', 
`
contract Simple1 =
  type t = 
  int
`)


    assert.deepStrictEqual( tp.removeLocationOffsetFromErrors(result.errors), [{
        message : 'Unexpected indentation',
        location : {
            begin : {
                line : 4,
                column : 3
            },
            end : {
                line   : 4,
                column : 3
            }
        }
}])

    })
})
