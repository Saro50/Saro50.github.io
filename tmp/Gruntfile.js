module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    pj : grunt.file.readJSON('project.json'),
    taskJs : grunt.file.readJSON("taskJs.json"),
    taskCss : grunt.file.readJSON("taskCss.json"),
    jshint: {
          options: {
            jshintrc: '.jshintrc'
          },
          main : {
             src: ['src/MKP_base.js']
          } 
        },
    concat: {
      // options: {
      //  // stripBanners: true, //  /* ... */ block comments are stripped, but NOT /*! ... */ comments.
      //   banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      //     '<%= grunt.template.today("yyyy-mm-dd") %> */',
      //     // define a string to put between each file in the concatenated output
      //   separator: ';'
      // },
      // basic_and_extras:{
      //   files: {
      //         // the files to concatenate
      //         'dest/MKP.all.js':['src/MKP.*.js']
      //       }
      // }
    },
    uglify : {
      options : {
        report:"gzip",
        banner : '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>  */\n'
       },
      main : {
          m1 : {
            options : {
            banner : '/*! here banner _1 <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>  */\n',
            sourceMap : "build/base.js.map"
          },
          files: {
            'build/base.min.js':'src/MKP_base.js'
            }  
        }   
      },
      next : {
          options : {
             banner : '/*! here banner _2 <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>  */\n',
             sourceMap : "build/base2.js.map",
             sourceMapRoot : "http://localhost:"
            },
          files: {
              'build/base2.min.js':'src/MKP_base.js'
            }     
        }
      },
    cssmin : {
      main: {
        options: {
          banner: '/* My minified css file */'
        },
        files: {
          'build/style.min.css': ['src/style.css','blog.css']
        }
      }
}
  });

  grunt.log.write('Logging some stuff...').ok();

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  // grunt.registerTask('default', ['jshint','concat','uglify']);
  grunt.registerTask('beforeConcat',"test log here" , function(arg1,data){
         // var done = this.async();
        // Run some sync stuff.
        // var result = grunt.task.run('jshint');
        // grunt.log.writeln('Processing task...');
        // setTimeout(function() {
        //   grunt.log.writeln('All done!');
        //    done();
        // }, 5000);
    var result = {},
        data = grunt.config.get(["prc","path"]),
        name = grunt.config.get(["pkg",'name']);
    console.dir(data);
    for(var p in data){
      if( data.hasOwnProperty(p) ){
        result[data[p] + "/" + name+".js"] = ['src/MKP.*.js'];
      }
    };
    // var result =  {
    //     "D:/WN/NM/MKP.all.js":['src/MKP.*.js']
    //             };
    grunt.config.set(["concat","basic_and_extras","files"], result );
      // var prc = grunt.config.get("prc");
  });
  var KEY = [ "description" , "required" ],
      taskQueue = [],
      taskJs = grunt.config.get(["taskJs"]),
      projects = grunt.config.get(["pj"]);

    /*
        @param val : any Type of javascript #check unknow type argument
    */

  function type( val ){
    var toString = Object.prototype.toString;
      return toString.call(val).split(" ")[1].replace("]","");
  }
  /*
    @param obj: object | Array #Iteration object
    @param fn: function #Iteration function {return false only false will interrupt iterating}
    @param recursion : boolean , #default value false   

  */

  function each( obj , fn , recursion){
    var i , j , t = type(obj) ,r = recursion || false ;
    switch( t ){
      case "Array":
        for( i = 0 , j = obj.length; i < j ; ++i ){
            if( fn( obj[i] , i ) === false ){
              return false;
            }        
            if(recursion && (type(obj[i]) == "Array"||type(obj[i]) == "Object")){
              each(obj[i] , fn , recursion);
            }
        }
        break;
      case "Object":
        for( i in obj ){
          if( obj.hasOwnProperty( i ) ){
            if( fn( obj[i] , i ) === false ){
              return false;
            }
            if(recursion && (type(obj[i]) == "Array"||type(obj[i]) == "Object")){
              each(obj[i] , fn , recursion);
            }
          }
        }        
        break;
      default:
        throw {
          message : "Wrong type!"
        };
        break;
    }
    return true;
  }

 function isSub( arr , val1 ){
   return  each(arr, function(val2 , i){
      return !(val2 === val1); 
    });
  }



  function search( father , pjName ){
    var result ;
      each( father , function( val , p){
        if( p === pjName ){
          result = val;
          return false;
        }
      },true);
      return result;
  }

  var ProjectModel ={
    get : function( name ){
      return this[name];
    },
    Lib : (function(){
    var lib = taskJs.lib,
        _lib = {} ;
        each( lib ,function( val , p ){
                _lib[p] = {};
                _lib[p].basePath = [];
                _lib[p].relativePath = "",
                _lib[p].path = [];
                _lib[p].required = [];
                each( val , function( val , i ){
                    if( i !== "description" ){
                      _lib[p].relativePath = i;
                      _lib[p].required = val;
                    }
                });
                if(type(val.description) === "Object"){
                  try{
                    each( val.description.project , function( val , i ){
                      if( type( projects[val] ) === "Object" ){
                        each( projects[val] , function( v , j ){
                             _lib[p].path.push( v + _lib[p].relativePath );
                             _lib[p].basePath.push( v );
                        });
                      }else{
                        _lib[p].path.push( projects[val] + _lib[p].relativePath );
                        _lib[p].basePath.push( projects[val] );
                      }
                    });
                  }catch(e){

                  }
                }

          });
        return _lib;
  })()
}

function createFiles( val , options ){
  var files = {},
      options = options || {};
      each(val.path , function( p , i ){
        files[p] = val.required;
      });
      return files;
}

function SubTask( val , options ){
  this.files = createFiles( val );
  if(options){
    this.options;
  }
  return this;
}




/*
  @param taskName : String .ex "test"
  @param pjName : Array .ex ["dld","index"]
*/
  function processTask( taskName  ,  pjName , options ){
    var op = options || {
          description : "some task",
          jshint : true,
          concat : true,
          uglify : true
        },
        qType = ["jshint" , "concat" , "uglify"],
        des = op.description || "some task" ;
        taskQueue.push(taskName);
        var task =new SubTask( search( ProjectModel.get(pjName[0]) ,  pjName[1] ) );
        each(qType , function( name , i ){
              if(op[name] !== false ){
                grunt.config.set([name,taskName ], task );
              }
            });
  }



  grunt.registerTask("test" , 'test loging' , function( arg1 , data ){
      processTask( "MKPlib" , [ "Lib" , "MKPtool"]);
      
   // var MM = grunt.template.process('<%= baz %>', {data: obj})
    
  });


 

  // grunt.registerTask("default",['jshint', 'qunit', 'clean', 'concat', 'uglify']);
 grunt.registerTask("default",[ "test" , 'concat' ]);
};

