###
#
###
_xhr = ->
	try
		return ( _xhr = -> new XMLHttpRequest() )()
	catch e
		try
			return ( _xhr = -> new ActiveXObject('Msxml2.XMLHTTP') )()
		catch e
			return ( _xhr = -> new ActiveXObject('Microsoft.XMLHTTP') )()
		#END try catch
	#END try catch
#END xhr

###
#
###
_get = (url, options) ->
	options = {'success': options} if isFunction( options )
	options = {} unless isObject( options )
	options['success'] = (->) unless isFunction( options['success'] )
	options['error'] = (->) unless isFunction( options['error'] )
	options['complete'] = (->) unless isFunction( options['complete'] )

	x = _xhr()
	x.open('GET', url, true)
	x.onreadystatechange = -> 
		if x.readyState is 4
			status = x.status
			response = x.responseText

			if status >= 200 and status < 400
				options['success']( response, status, x )
			else
				options['error']( response, status, x )
			#END if

			options['complete']( response, status, x)
		#END if
	#END onStateChange

	x.send()
#END _send


if 'localStorage' of window and window['localStorage']?
	_retrieve = (key) ->
		return window['localStorage']["!!!HB!!!#{key}"]
	#END _rerieve
	
	_store = (key, value) ->
		window['localStorage']["!!!HB!!!#{key}"] = value
	#END _store

	_expire = ->
		for key, value of window['localStorage']
			if key[0...8] is "!!!HB!!!"
				filename = key[8...]
				( delete window['localStorage'][key] ) unless (filename of _versions_ or filename is "versions")
			#END if
		#END for
	#END expire
else
	_storage_ = {}
	_retrieve = (key) ->
		return _storage_[key]
	#END _rerieve

	_store = (key, value) ->
		_storage_[key] = value
	#END _store

	_expire = (->)
#END if



###
#
###
_load = ->
	return unless _versions_?
	return if _loading_

	if _queue_.length <= 0
		_expire()
		_store("versions", JSON.stringify( _current_versions_ ) )
		_complete_(_size_, _loaded_)
		return
	#END if

	_obj = _queue_.shift()

	src = _obj['src']
	{attempts, required, success, error} = _obj['options']
	loader = _obj['loader']
	current_version = _current_versions_[src]
	version = _versions_[src]

	_next = (code) ->
		loader( code, src )
		_loaded_++
		_loading_ = false

		_continue = ->
			if success.length is 4
				success( src, _size_, _loaded_, _load )
			else
				success( src, _size_, _loaded_ )
				_load()
			#END if
		#END _continue
		if _success_.length is 4
			_success_( src, _size_, _loaded_, _continue )
		else
			_success_( src, _size_, _loaded_ )
			_continue()
		#END if
	#END _next

	_retry = () ->
		_obj['options']['attempts']--
		_queue_.unshift( _obj )
		_load()
	#END _retry

	if version? and version is current_version
		_next( _retrieve(src) )
	else
		_loading_ = true

		_get "#{_endpoint_}/#{src}", 
			success: (code, status) ->
				_store( src, code )
				_current_versions_[src] = version
				_next( code )
			#END success

			error: (code, status) ->
				if attempts > 1
					_retry()
				else
					#TODO: This needs to work correctly
					#Always call failure when all attempts have failed
					#Increment the failure count
					#Call halt when the file is required, add size, loaded, and src that halted
					#Call load when file is not required
					if _failure_.length is 4
						_failure_( src, _size_, _loaded_, (if required then _halt_ else _load) )
					else
						_failure_( src, _size_, _loaded_ )
						if required then _halt_() else _load()
					#END if
				#END if
			#END error
		#END _get
	#END if

	return
#END _load

_load_script = (code, src) ->
	elm = document.createElement( 'script' )
	elm.innerHTML = code
	elm.type = "text/javascript"
	elm.language = "javascript"
	_head_.appendChild( elm )
#END _load_script

_load_style = (code, src) ->
	elm = document.createElement( 'style' )
	elm.innerHTML = code
	elm.type = "text/css"
	_head_.appendChild( elm )
#END _load_style

_load_template = (code, src) ->
	return unless Falcon?

	url = Falcon.View::makeUrl.call({ 'url': src })
	Falcon.View.cacheTemplate( url, code )
#END _load_template

_make_options = (options) ->
	options = { 'success': options, 'attempts': 1 } if isFunction( options )
	options = {} unless isObject( options )
	options.attempts = 0 unless isNumber( options.attempts )
	options.required = true unless isBoolean( options.required )
	options.success = (->) unless isFunction( options.success )
	options.error = (->) unless isFunction( options.error )

	options.attempts = parseInt( if options.attempts < 0 then 0 else options.attempts )

	return options
#END _make_options


_head_ = document.getElementsByTagName('head')[0]
_endpoint_ = null
_queue_ = []
_requested_ = {}
_current_versions_ = null
_versions_ = null
_loading_ = false
_size_ = 0
_loaded_ = 0
_start_ = (->)
_success_ = (->)
_complete_ = (->)
_failure_ = (->)
_halt_ = (->)

Humingbird = (endpoint) ->
	_endpoint_ = endpoint ? ""

	_current_versions_ = JSON.parse( _retrieve("versions") ? "{}" )

	_start_load = () ->
		if _start_.length is 2
			_start_(_size_, _load)
		else
			_start_(_size_)
			_load()
		#END if
	#END _start_load

	#TODO: execute expire code here
	_get "#{_endpoint_}/versions", 
		success: (versions) ->
			_versions_ = JSON.parse( versions )
			_start_load()
		#END success

		error: ->
			_versions_ = _current_versions_
			_start_load()
		#END error
	#END _get

	return Humingbird
#END Humingbird

Humingbird.script = (src, options) ->
	_size_++
	_queue_.push( {'loader': _load_script, 'src': src, 'options': _make_options( options ) } )

	return Humingbird
#END Humingbird.script

Humingbird.style = (src, options) ->
	_size_++
	_queue_.push( {'loader': _load_style, 'src': src, 'options':  _make_options( options ) } )

	return Humingbird
#END Humingbird.style

Humingbird.template = (src, options) ->
	_size_++
	_queue_.push( {'loader': _load_template, 'src': src, 'options':  _make_options( options ) } )

	return Humingbird
#END Humingbird.template

Humingbird.start = (callback) ->
	callback = (->) unless isFunction( callback )
	_start_ = callback
	return Humingbird
#END start

Humingbird.complete = (callback) ->
	callback = (->) unless isFunction( callback )
	_complete_ = callback
	return Humingbird
#END complete

Humingbird.success = (callback) ->
	callback = (->) unless isFunction( callback )
	_success_ = callback
	return Humingbird
#END success

Humingbird.failure = (callback) ->
	callback = (->) unless isFunction( callback )
	_failure_ = callback
	return Humingbird
#END failure

Humingbird.halt = (callback) ->
	callback = (->) unless isFunction( callback )
	_halt_ = callback
	return Humingbird
#END halt

window.Humingbird = Humingbird