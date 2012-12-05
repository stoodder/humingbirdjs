# ==========================================================
# File: utility.coffee
#	Handles internal utitlity methods so we can reduce
#	our dependency on external libraries for this
# ==========================================================

# -------------------------------------------------
# CHECKING FUNCTIONS
# -------------------------------------------------
isObject = (object) -> Object::toString.call( object ) is "[object Object]"
isFunction = (object) -> Object::toString.call( object ) is "[object Function]"
isNumber = (object) -> Object::toString.call( object ) is "[object Number]"
isBoolean = (object) -> Object::toString.call( object ) is "[object Boolean]"
endsWith = (haystack, needle) ->  haystack.indexOf(needle, haystack.length - needle.length) isnt -1
