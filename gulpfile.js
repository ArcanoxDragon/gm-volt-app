var del = require( "del" );
var gulp = require( "gulp" );
var merge = require( "merge-stream" );
var path = require( "path" );
var sourcemaps = require( "gulp-sourcemaps" );
var ts = require( "gulp-typescript" );

var debug = false;
var tsProject = ts.createProject( "tsconfig.json" );

function compileTsProject( tsProject, outputDir ) {
    var tsResult = tsProject
        .src()
        .pipe( sourcemaps.init() )
        .pipe( tsProject() );

    var dtsStream = tsResult.dts
        .pipe( gulp.dest( outputDir ) );

    var tsStream = tsResult.js;

    if ( debug )
        tsStream = tsStream.pipe( sourcemaps.write( {
            // Return relative source map root directories per file.
            sourceRoot: function( file ) {
                var sourceFile = path.join( file.cwd, file.sourceMap.file );
                return path.relative( path.dirname( sourceFile ), file.cwd );
            }
        } ) );

    tsStream = tsStream.pipe( gulp.dest( outputDir ) );

    return merge( dtsStream, tsStream );
}

gulp.task( "clean-unwanted-types", function() {
    return del( [
        "node_modules/@types/node/**/*",
        "node_modules/@types/node/**"
    ] );
} );

gulp.task( "clean", gulp.series( "clean-unwanted-types", function() {
    return del( [
        "build/**/*.js",
        "build/**",
        "typings/**/*",
        "typings/*"
    ] );
} ) );

gulp.task( "build-ts", gulp.series( "clean-unwanted-types", function() {
    return compileTsProject( tsProject, "build" );
} ) );

gulp.task( "build", gulp.parallel( "build-ts" ) );
gulp.task( "rebuild", gulp.series( "clean", "build" ) );

gulp.task( "watch", gulp.series( "build", function() {
    gulp.watch( "src/**/*", gulp.series( "build-ts" ) );
} ) );

gulp.task( "debug", function( done ) {
    debug = true;
    done();
} );

gulp.task( "build-dev", gulp.series( "debug", "build" ) );
gulp.task( "rebuild-dev", gulp.series( "debug", "rebuild" ) );
gulp.task( "watch-dev", gulp.series( "debug", "watch" ) );