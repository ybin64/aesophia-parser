// Compilation of "aecli compiler compile ..." behaviour



/*
Invalid identifier

-----
contract Simple1 = 
  type Foo = int
-----


<compiler error 1>
  <compiler erro #1>
    Message _________________________________________ Unexpected identifier Foo. Did you mean foo?

    <pos>
      Col ___________________________________________ 8
      Line __________________________________________ 2
    </pos>
    Type ____________________________________________ parse_error
  </compiler erro #1>
</compiler error>

/*

-----
contract Simple1 = type t = int
-----

Valid according to aecli, is this really correct?
*/


/*

-----
contract Simple1 = 
  type foo('a, 'b, ) = int
-----

/Users/nicklas/src/elixir/ae-projs/venv/py3/bin/aecli compiler compile simple-1.aes
<compiler error 1>
  <compiler erro #1>
    Message _________________________________________ Unexpected token ')'.

    <pos>
      Col ___________________________________________ 20
      Line __________________________________________ 2
    </pos>
    Type ____________________________________________ parse_error
  </compiler erro #1>
</compiler error>

*/




/*

-----
contract Simple1 = 
  type foo = list 
-----

<compiler error 1>
  <compiler erro #1>
    Message _________________________________________ Unknown error: {wrong_type_arguments,
                   {id,[{file,no_file},{line,2},{col,14}],"list"},
                   0,1}

    <pos>
      Col ___________________________________________ 0
      Line __________________________________________ 0
    </pos>
    Type ____________________________________________ type_error
  </compiler erro #1>
</compiler error>

*/


/*

------
contract Simple1 = 
    record spend_args = {}
------

Valid according to aecli, is an empty record really allowed?
 */