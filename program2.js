var canvas;
var gl;
var programId;

var at = [0.0, 0.0, 0.0];
var dir = [0.0, 1.0, 0.0];
var eye = [0.0, 0.0, -5.0];

var pMatrix_handle, mvMatrix_handle;
var projection_mat = mat4();
var modelview_mat = mat4();



// Binds "on-change" events for the controls on the web page
function initControlEvents() {
	document.getElementById("superquadric-constant-n1").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};

	document.getElementById("superquadric-constant-n2").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};

	document.getElementById("superquadric-constant-a").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};

	document.getElementById("superquadric-constant-b").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};
	document.getElementById("superquadric-constant-c").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};
	document.getElementById("superquadric-constant-c").onchange = 
		function(e) {
			updateBuffer();
			drawScene();
		};
	document.getElementById("foreground-color").onchange = 
      	function(e) {
            updateBuffer();
			drawScene();
    };

	document.onkeydown = function checkKey(e) {

    	e = e || window.event;

    	if (e.keyCode == '38') {
        // up arrow
        	eye[1] -= 1;
        	at[1] -= 1;
        	drawScene();
    	}
    	else if (e.keyCode == '40') {
        // down arrow
        	eye[1] += 1;
        	at[1] += 1;
        	drawScene();
    	}
    	else if (e.keyCode == '37') {
       	// left arrow
       		eye[0] -= 1;
       		at[0] -= 1;
       		drawScene();
    	}
    	else if (e.keyCode == '39') {
    	   // right arrow
    	   eye[0] += 1;
    	   at[0] += 1;
    	   drawScene();
    	}
    	else if (e.keyCode == '188'){
    		eye[2] += 1;
        	drawScene();
    	}
    	else if (e.keyCode == '190'){
    		eye[2] -= 1;
        	drawScene();
    	}

	}
	var pos = {};
	var moving = false;
	
	

	document.getElementById("gl-canvas").onmouseup = function(event){
		moving = false;
	}
	document.getElementById("gl-canvas").onmousedown = function(event){
		moving = true;
	}
	/*
	document.getElementById("gl-canvas").onmousemove = function(event){
		
		prevX = pos.x;
		prevY = pos.y;
		
		pos.x = event.pageX;
		pos.y = event.pageY;

		//prevEyeX = eye[0];
		//prevEyeY = eye[1];
		
		while (moving){
			//eye[0] = prevX;
			//eye[1] = prevY;
			change = {};
			change.x = (pos.x - prevX);
			change.y = (pos.y - prevY);

			eye[0] += change.x;
			eye[1] += change.y;


		}
		
	}
	*/

	
}





// Function for querying the current superquadric constants: a, b, c, d, n1, n2
function getSuperquadricConstants() {
	return {
		n1: parseFloat(document.getElementById("superquadric-constant-n1").value),
		n2: parseFloat(document.getElementById("superquadric-constant-n2").value),
		a: parseFloat(document.getElementById("superquadric-constant-a").value),
		b: parseFloat(document.getElementById("superquadric-constant-b").value),
		c: parseFloat(document.getElementById("superquadric-constant-c").value),
	}
}

// Function for querying the current wireframe color
function getWireframeColor() {
	var hex = document.getElementById("foreground-color").value;
	var red = parseInt(hex.substring(1, 3), 16);
	var green = parseInt(hex.substring(3, 5), 16);
	var blue = parseInt(hex.substring(5, 7), 16);
	return vec3(red / 255.0, green / 255.0, blue / 255.0);
}

window.onload = function() {
	// Find the canvas on the page
	canvas = document.getElementById("gl-canvas");

	// Initialize a WebGL context
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { 
		alert("WebGL isn't available"); 
	}

	window.onkeydown = function (e) {
		var key = String.fromCharCode(e.keyCode); 
  		switch(key) {
    	case 'Q':
            window.close();
            break;
    	case 'R':
            rotating = true;
            break;
        case 'S':
        	rotating = false;
        	break;
  		}
	}

	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

	// Load shaders
	programId = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(programId);

	programId.vertexPositionAttribute = gl.getAttribLocation(programId, "aVertexPosition");
	gl.enableVertexAttribArray(programId.vertexPositionAttribute);

	thetaLocation = gl.getUniformLocation( programId, "theta" );
	
    //gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);

    




	//pMatrix_handle = gl.getUniformLocation(programId, "uPMatrix");
	//mvMatrix_handle = gl.getUniformLocation(programId, "uMVMatrix");
	programId.pMatrixHandle = gl.getUniformLocation(programId, "uPMatrix");
	programId.mvMatrixHandle = gl.getUniformLocation(programId, "uMVMatrix");

	// Set up events for the HTML controls
	initControlEvents();

	//initialize superellipsoid
	var v = getSuperquadricConstants();
    superEllipsoid.setValues(v.a,v.b,v.c,v.n1,v.n2);
    superEllipsoid.render();
    superEllipsoid.pushPoints();

    programId.vertexPositionAttribute = gl.getAttribLocation(programId, "aVertexPosition");
	gl.enableVertexAttribArray(programId.vertexPositionAttribute);

	// Initialize buffers
	initBuffers();




	// Prepara for rendering
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);


	drawScene();

	window.setInterval(function () {
  		if (rotating) {
            Theta = add(Theta, dTheta);
        }
  			drawScene(); 	
	}, 16);
};

function setMatrixUniforms() {
	//gl.uniformMatrix4fv(pMatrix_handle, false, flatten(projection_mat));
	//gl.uniformMatrix4fv(mvMatrix_handle, false, flatten(modelview_mat));
	gl.uniformMatrix4fv(programId.pMatrixHandle, false, flatten(projection_mat));
	gl.uniformMatrix4fv(programId.mvMatrixHandle, false, flatten(modelview_mat));
};


var squareVertexBuffer;
var ellipsoidBuffer;
var colorsBuffer;
function initBuffers() {
	squareVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
	vertices = [
		1.0, 1.0, 0.0,
		-1.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
			];
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	squareVertexBuffer.itemSize = 3;
	squareVertexBuffer.numItems = 4;

	//ellipsoid
	ellipsoidBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ellipsoidBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


};



var superEllipsoid = {
    
    a: null,
    b: null,
    c: null,
    n1: null,
    n2: null,
    d: null,

    render : function () {
        NumVertices = 0;
        NumCircles = 0;
        this.d = .05;
        for( var l = -Math.PI/2; l< Math.PI/2; l+= this.d){
            for(var u = -Math.PI; u< Math.PI; u+= this.d)
            {
                var x = this.a*Math.sign(Math.cos(l))*Math.pow(Math.abs(Math.cos(l)), 2/this.n1)*Math.sign(Math.cos(u))*Math.pow(Math.abs(Math.cos(u)), 2/this.n2);
                var y = this.b*Math.sign(Math.cos(l))*Math.pow(Math.abs(Math.cos(l)), 2/this.n1)*Math.pow(Math.abs(Math.sin(u)), 2/this.n2)*Math.sign(Math.sin(u)); 
                var z = this.c*Math.pow(Math.abs(Math.sin(l)), 2/this.n1)*Math.sign(Math.sin(l));
                vertex_positions.push(vec4(x,y,z,1.0));
                NumVertices ++;
                //console.log(z);
            }
            NumCircles ++;
        }
        for( var u = -Math.PI; u< Math.PI; u+= this.d){
            for( var l = -Math.PI/2; l< Math.PI/2; l+= this.d)
            {
                var x = this.a*Math.sign(Math.cos(l))*Math.pow(Math.abs(Math.cos(l)), 2/this.n1)*Math.sign(Math.cos(u))*Math.pow(Math.abs(Math.cos(u)), 2/this.n2);
                var y = this.b*Math.sign(Math.cos(l))*Math.pow(Math.abs(Math.cos(l)), 2/this.n1)*Math.pow(Math.abs(Math.sin(u)), 2/this.n2)*Math.sign(Math.sin(u)); 
                var z = this.c*Math.pow(Math.abs(Math.sin(l)), 2/this.n1)*Math.sign(Math.sin(l));
                vertex_positions.push(vec4(x,y,z,1.0));
                NumVertices ++;
                //console.log(z);
            }
            NumCircles ++;
        }
    },
 
    pushPoints : function(){ 
        var ss = 0
        while( ss < NumVertices){
            points.push(vertex_positions[ss]);  
            colors.push(getWireframeColor());
            ss += 1;
        }
    },

    setValues : function(a,b,c,n1,n2){
        this.a = a;
        this.b = b;
        this.c = c;
        this.n1 = n1;
        this.n2 = n2;
    },

    flushValues : function(){
    	vertex_positions = [];
    	points = [];
    	colors = [];
    }  
};


function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	projection_mat = perspective(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100);
	modelview_mat = lookAt(eye, at, dir);

	/*
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
	gl.vertexAttribPointer(programId.vertexPositionAttribute, squareVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	*/
	gl.bindBuffer(gl.ARRAY_BUFFER, ellipsoidBuffer);
	gl.vertexAttribPointer(programId.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
	//gl.vertexAttribPointer(programId.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
	//gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
	//gl.vertexAttribPointer(programId.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);
	fColor = gl.getUniformLocation(programId, "fColor");
	gl.uniform4fv(fColor, flatten(vec4(getWireframeColor(),1.0)));
	setMatrixUniforms();

	var numPointsPerCircle = (NumVertices/NumCircles)/4;
    for (var i=0; i< NumCircles; i++){
        gl.drawArrays( gl.LINE_STRIP, i*numPointsPerCircle, (i+1)*numPointsPerCircle);//((NumVertices*3)/NumCircles)/4 );
    }

	//var numPointsPerCircle = Math.ceil((NumVertices/NumCircles)/4);
    
    gl.uniform3fv( thetaLocation, Theta );
    gl.drawArrays(gl.LINE_LOOP, 0, NumVertices/4);
	gl.flush();

};

function updateBuffer(){
	var v = getSuperquadricConstants();
	superEllipsoid.flushValues();
    superEllipsoid.setValues(v.a,v.b,v.c,v.n1,v.n2);
    superEllipsoid.render();
    superEllipsoid.pushPoints();

	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	//gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	//console.log(flatten(points));
};



var points = [];
var colors = [];
var NumVertices;
var vertex_positions = [];
var NumCircles;

var Theta = vec3(0.0);   // A vec3 containing Axis angles
var dTheta = vec3(0.1, 0.1, 0.1);
var thetaLocation;
var rotating = false;
