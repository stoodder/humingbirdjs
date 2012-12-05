# Building Falcon requires coffee-script and uglify-js. For
# help installing, try:
#
# `npm -g install coffee-script uglify-js wrench`
# `gem install sass`
#
# Original Cake file from Chosen.js - modified for our use
#   https://github.com/harvesthq/chosen/blob/master/Cakefile
fs              	= require 'fs'
{spawn, exec}   	= require 'child_process'
CoffeeScript    	= require 'coffee-script'
{parser, uglify}	= require 'uglify-js'
wrench          	= require 'wrench'

# Get the version number
version_file = 'VERSION'
version = "#{fs.readFileSync(version_file)}".replace( /[^0-9a-zA-Z.]*/gm, '' ) if fs.existsSync( version_file )
version_tag = -> "v#{version}"

extendArray = (_array, _ext) -> 
	ret = []
	ret.push( val ) for val in _array
	ret.push( val ) for val in _ext
	return ret
#END exendArray

sassMath = "./private/sass/mixins/math.rb"

copiedFiles = {}

compiledCoffeeFiles = {
	"scripts/humingbird.js": [
		"coffee/header.coffee"
		"coffee/utility.coffee"
		"coffee/humingbird.coffee"
		
	]
}

compiledSassFiles = {}
combinedScriptFiles = {}

# Method used to write a javascript file
write_file = (filename, body) ->
	body = body.replace(
		/\{\{VERSION\}\}/gi, version
	).replace(
		/\{\{VERSION_TAG\}\}/gi, version_tag
	)
	fs.writeFileSync filename, body
	console.log "Wrote #{filename}"

# Task to build the current source
task 'build', 'build coffee from source', build = (cb) ->
	for destination, sources of compiledCoffeeFiles
		do ->
			code = minified_code = ""
			file_name = file_contents = ""
			try

				file_name = destination
				file_contents = ""
				file_contents += "#{fs.readFileSync(source)}\r\n" for source in sources when fs.existsSync(source)

				code = CoffeeScript.compile(file_contents)
				minified_code = parser.parse( code )
				minified_code = uglify.ast_mangle( minified_code )
				minified_code = uglify.ast_squeeze( minified_code )
				minified_code = uglify.gen_code( minified_code )

				write_file(file_name, code)
				write_file(file_name.replace(/\.js$/,'.min.js'), minified_code)

				cb() if typeof cb is 'function'
			catch e
				print_error e, file_name, file_contents
		#END do

#END build task

task 'combine', 'Combine dependant script files into one', (cb) ->
	try
		for destination, sources of combinedScriptFiles
			code = ( fs.readFileSync(source) for source in sources when fs.existsSync(source) ).join("\r\n")

			minified_code = parser.parse( code )
			minified_code = uglify.ast_mangle( minified_code )
			minified_code = uglify.ast_squeeze( minified_code )
			minified_code = uglify.gen_code( minified_code )
			
			write_file( destination, code )
			write_file( destination.replace(/\.js$/,'.min.js'), minified_code )
		#END for

		cb() if typeof cb is 'function'
	catch e
		print_error e, file_name, file_contents
#END minify

# Task to build the current source
task 'copy', 'copy from source', build = (cb) ->
	try
		for destination, source of copiedFiles when fs.existsSync(source)
			write_file(destination, "#{fs.readFileSync(source)}")

		cb() if typeof cb is 'function'
	catch e
		print_error e
#END copy task

#Task for building sass file
task 'build_sass', 'Build sass from source', ->
	count = 0
	for destination, sources of compiledSassFiles
		do ->
			try
				file_name = destination
				min_destination = destination.replace(/\.css$/,'.min.css')
				temp_destination = "__temp_" + (new Date).valueOf() + "_#{count}__.sass"

				file_contents = ""
				file_contents += "#{fs.readFileSync(source)}\r\n" for source in sources when fs.existsSync(source)

				write_file(temp_destination, file_contents)

				exec "sass --update #{temp_destination}:#{destination} --style expanded", (messages) ->
					console.log("Wrote #{destination}")
					console.error( messages ) if messages?.code is 1
					exec "sass --update #{temp_destination}:#{min_destination} --style compressed", ->
						console.log("Wrote #{min_destination}")
						fs.unlink(temp_destination)
						console.log("Cleaning: #{temp_destination}")

						#lastly try to delete in .sass-cache directory
						try
							wrench.rmdirSyncRecursive('.sass-cache')
						catch error
						#END try/catch
					#END min exec
				#END exec

				count++
			catch error
				print_error error, file_name, file_contents
			#END try/catch
		#END do
	#END for

#END build_sass task

#Task to watch files (so they're built when saved)
task 'watch', 'watch coffee/ and tests/ for changes and build', ->
	console.log "Watching for changes"

	for destination, sources of compiledCoffeeFiles
		for source in sources
			if fs.existsSync( source )
				console.log "Watching for changes in #{source}"
				fs.watch( source, (curr, prev) ->
					console.log "#{new Date}: Saw change in #{source}"
					invoke 'build'
				)
			else
				console.error("\r\nERROR: Could not find file #{source} to compile\r\n")
			#END if
		#END for
	#END for

	invoke 'build'

	for destination, sources of compiledSassFiles
		for source in sources
			if fs.existsSync( source )
				console.log "Watching for changes in #{source}"
				fs.watch( source, (curr, prev) ->
					console.log "#{new Date}: Saw change in #{source}"
					invoke 'build_sass'
				)
			else
				console.error("\r\nERROR: Could not find file #{source} to compile\r\n")
			#END if
		#END for
	#END for

	invoke 'build_sass'

	for destination, sources of combinedScriptFiles
		for source in sources
			if fs.existsSync( source )
				console.log "Watching for changes in #{source}"
				fs.watch( source, (curr, prev) ->
					console.log "#{new Date}: Saw change in #{source}"
					invoke 'combine'
				)
			else
				console.error("\r\nERROR: Could not find file #{source} to combine\r\n")
			#END if
		#END for
	#END for
	
	invoke 'combine'

	for destination, source of copiedFiles
		if fs.existsSync( source )
			console.log "Watching for changes in #{source}"
			fs.watch( source, (curr, prev) ->
				console.log "#{new Date}: Saw change in #{source}"
				invoke 'copy'
			)
		else
			console.error("\r\nERROR: Could not find file #{source} to copy\r\n")
		#END if
	#END for

	invoke 'copy'
#END watch task

print_error = (error, file_name, file_contents) ->
	line = error.message.match /line ([0-9]+):/
	if line && line[1] && line = parseInt(line[1])
		contents_lines = file_contents.split "\n"
		first = if line-4 < 0 then 0 else line-4
		last  = if line+3 > contents_lines.size then contents_lines.size else line+3
		console.log "Error compiling #{file_name}. \"#{error.message}\"\n"
		index = 0
		for line in contents_lines[first...last]
			index++
			line_number = first + 1 + index
			console.log "#{(' ' for [0..(3-(line_number.toString().length))]).join('')} #{line}"
	else
		console.log "Error compiling #{file_name}: #{error.message}"
