var canvas;
var gl;
var programId;

// Define two constants (by convention) for the number of subdivisions of u and v.
var SUBDIV_U = 32;
var SUBDIV_V = 16;


// Binds "on-change" events for the controls on the web page
function initControlEvents() {
    // Use one event handler for all of the shape controls
    document.getElementById("shape-select").onchange = 
    document.getElementById("superquadric-constant-n1").onchange = 
    document.getElementById("superquadric-constant-n2").onchange = 
    document.getElementById("superquadric-constant-a").onchange =
    document.getElementById("superquadric-constant-b").onchange =
    document.getElementById("superquadric-constant-c").onchange =
    document.getElementById("superquadric-constant-d").onchange =
        function(e) {
            var shape = document.getElementById("shape-select").value;
            
            // Disable the "d" parameter if the shape is not a supertorus
            if (shape === "supertorus") {
                document.getElementById("superquadric-constant-d").disabled = false;
            }
            else {
                document.getElementById("superquadric-constant-d").disabled = true;
            }
            
            // Regenerate the vertex data
            updateWireframe(superquadrics[document.getElementById("shape-select").value],
            getSuperquadricConstants(), SUBDIV_U, SUBDIV_V);
            updateBuffers();
        };
        
    // Event handler for the foreground color control
    document.getElementById("foreground-color").onchange = 
        function(e) {
            updateWireframeColor(getWireframeColor());
            updateBuffers()
        };
        
    // Event handler for the FOV control
    document.getElementById("fov").onchange =
        function(e) {
            updateProjection(perspective(getFOV(), 1, 0.01, 100));
            updateBuffers()
        };

    document.getElementById("surface-material").onchange =
        function(e) {
            updateSurfaceMaterial(getSurfaceMaterial());
            //updateBuffers()
        };
}

// Function for querying the current superquadric constants: a, b, c, d, n1, n2
function getSuperquadricConstants() {
    return {
        a: parseFloat(document.getElementById("superquadric-constant-a").value),
        b: parseFloat(document.getElementById("superquadric-constant-b").value),
        c: parseFloat(document.getElementById("superquadric-constant-c").value),
        d: parseFloat(document.getElementById("superquadric-constant-d").value),
        n1: parseFloat(document.getElementById("superquadric-constant-n1").value),
        n2: parseFloat(document.getElementById("superquadric-constant-n2").value)
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

// Function for querying the current field of view
function getFOV() {
    return parseFloat(document.getElementById("fov").value);
}

// finds the type of material
function getSurfaceMaterial() {
    var materialId = parseFloat(document.getElementById("surface-material").value);
    if (materialId === 2){
        image = document.getElementById("tile-img");
        configureTexture( image );
        updateTexMapIndication(1);
    } 
    else if(materialId === 3) {
        image = document.getElementById("wood-img");
        configureTexture( image );
        updateTexMapIndication(1);
    }
    else{
        updateTexMapIndication(0);
    }
    return materialId;
}

window.onload = function() {
    // Find the canvas on the page
    canvas = document.getElementById("gl-canvas");
    
    // Initialize a WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
    }
    
    // Load shaders
    programId = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(programId);
    
    // Set up events for the HTML controls
    initControlEvents();

    //enable depth test
    gl.enable(gl.DEPTH_TEST);
    // Setup mouse and keyboard input
    initWindowEvents();
    
    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Load the initial data into the GPU
    updateWireframe(superquadrics.superellipsoid, getSuperquadricConstants(), SUBDIV_U, SUBDIV_V);

    //Normal buffer
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    vNormal = gl.getAttribLocation( programId, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    //vertex Buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    vBuffer.itemSize = 3;
    vBuffer.numItems = wireframePointCount;

    var vPosition = gl.getAttribLocation(programId, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    
    //texture buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( programId, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    
    

    // Initialize the view and rotation matrices
    findShaderVariables();
    viewMatrix = lookAt(vec3(0,0,5), vec3(0,0,0), vec3(0,1,0));
    rotationMatrix = mat4(1);
    updateModelView(viewMatrix);

    //Lighting variables
    lightPosition = vec4(2.0,1.0,1.0,1.0);
    lightRotationMatrix = mat4(1);
    lightAmbient = vec4(.1, .1, .1, 1.0 );
    lightDiffuse = vec4( .4, .4, .4, 1.0 );
    lightSpecular = vec4( .8, .8, .8, 1.0 );
    

    // Initialize the projection matrix
    updateProjection(perspective(getFOV(), 1, 0.01, 100));
    
    
    // Initialize the wireframe color
    updateWireframeColor(getWireframeColor());

    // Initialize the surface color
    updateSurfaceMaterial(getSurfaceMaterial());

    // Initialize the light position
    updateLightPosition(lightPosition);

    // 
    updateTexMapIndication(0);

    // Start continuous rendering
    window.setInterval(render, 33);
};

// The current view matrix
var viewMatrix;

// Surface material types
var YellowPlastic = {
    ambient: vec4(0.5, 0.5, 0.0, 1.0),
    diffuse: vec4(1, 1, 0, 1.0),
    specular: vec4(.7, .7, 0, 1.0),
    shininess: .25
};

var BrassMetal= {
    ambient: vec4(.3294,.2235, .02745,1.0),
    diffuse: vec4(.78, .56,0.113,10.0),
    specular: vec4(.95,.94,0.807,0.0),
    shininess: 2
};

var Tile = {
    ambient: vec4(1,1,1,1.0),
    diffuse: vec4(1.0, 1.0,1.0,10.0),
    specular: vec4(0.3,0.3,0.3,0.0),
    shininess: 50
};

var Wood = {
    ambient: vec4(1,1,1,1.0),
    diffuse: vec4(1, 1,1,1,0.0),
    specular: vec4(0.0,0.0,0.0,0.0),
    shininess: .2
};

var SurfaceMaterials  = [YellowPlastic, BrassMetal, Tile, Wood];
    


// The current rotation matrix produced as the result of cumulative mouse drags.
// I chose to implement the effect of mouse dragging as "rotating the object."
// It would also be acceptable to implement it as "moving the camera."
var rotationMatrix;

//light variables
var lightAmbient,lightDiffuse ,lightSpecula;
var ambientColor, diffuseColor, specularColor;
var normalMatrix, normalMatrixLoc;

//texture mapping
var image;
var texture;

//buffer variable
var vBuffer;
var nBuffer;
var tBuffer;

//light position
var lightPosition;

//vertex points and normal vectors, text coordinates    
var normalsArray = [];
var pointsArray = [];
var texArray = [];


//normal matrix
var normalMatrix, normalMatrixLoc;
// The OpenGL ID of the vertex buffer containing the current shape
var wireframeBufferId;

// The OpenGL ID of the vertex buffer containing the 
var normalsBufferId;

// The number of vertices in the current vertex buffer
var wireframePointCount;

// Sets up keyboard and mouse events
function initWindowEvents() {

    // Affects how much the camera moves when the mouse is dragged.
    var sensitivity = 1;

    // Additional rotation caused by an active drag.
    var newRotationMatrix;
    
    // Whether or not the mouse button is currently being held down for a drag.
    var mousePressed = false;
    var shiftPressed = false;
    
    // The place where a mouse drag was started.
    var startX, startY;

    canvas.onmousedown = function(e) {
        // A mouse drag started.
        mousePressed = true;
        
        // Remember where the mouse drag started.
        startX = e.clientX;
        startY = e.clientY;
    }

    canvas.onmousemove = function(e) {
        if (mousePressed && !shiftPressed) {
            // Handle a mouse drag by constructing an axis-angle rotation matrix
            var axis = vec3(e.clientY - startY, e.clientX - startX, 0.0);
            var angle = length(axis) * sensitivity;
            if (angle > 0.0) {
                // Update the temporary rotation matrix
                newRotationMatrix = mult(rotate(angle, axis), rotationMatrix);
                
                // Update the model-view matrix.
                updateModelView(mult(viewMatrix, newRotationMatrix));
            }
        }
        
        if (mousePressed && shiftPressed) {

            dx = e.clientX - startX;
            dy = e.clientY - startY;

            lightPosition = vec4(lightPosition[0]+dx/100, lightPosition[1]-dy/100, lightPosition[2], 0);
            updateLightPosition(lightPosition);

            
            

        }
    }

    window.onmouseup = function(e) {
        // A mouse drag ended.
        mousePressed = false;
        
        if (newRotationMatrix) {
            // "Lock" the temporary rotation as the current rotation matrix.
            rotationMatrix = newRotationMatrix;
        }
        newRotationMatrix = null;
    }

    window.onkeyup = function(e) {
        if (e.keyCode === 16){
            shiftPressed = false;
            
        }
    }
    
    var speed = 0.1; // Affects how fast the camera pans and "zooms"
    window.onkeydown = function(e) {
        if (e.keyCode === 190) { // '>' key
            // "Zoom" in
            viewMatrix = mult(translate(0,0,speed), viewMatrix);
        }
        else if (e.keyCode === 188) { // '<' key
            // "Zoom" out
            viewMatrix = mult(translate(0,0,-speed), viewMatrix);
        }
        else if (e.keyCode === 37) { // Left key
            // Pan left
            viewMatrix = mult(translate(speed,0,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault(); 
        }
        else if (e.keyCode === 38) { // Up key
            // Pan up
            viewMatrix = mult(translate(0,-speed,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        else if (e.keyCode === 39) { // Right key
            // Pan right
            viewMatrix = mult(translate(-speed,0,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        else if (e.keyCode === 40) { // Down key
            // Pan down 
            viewMatrix = mult(translate(0,speed,0), viewMatrix);
            
            // Prevent the page from scrolling, which is the default behavior for the arrow keys
            e.preventDefault();
        }
        
        else if (e.keyCode === 16) {
            // Remember where the mouse drag started

            shiftPressed = true;
        }
        
        // Update the model-view matrix and render.
        updateModelView(mult(viewMatrix, rotationMatrix));
        render();
    }
}

// Define the four possible superquadrics
var superquadrics = {
    superellipsoid: {
        evaluate: function(constants, u, v) {
            var cosU = Math.cos(u);
            var sinU = Math.sin(u);
            var cosV = Math.cos(v);
            var sinV = Math.sin(v);
            return vec3(
                constants.a * Math.sign(cosV * cosU) * Math.pow(Math.abs(cosV), 2 / constants.n1) * 
                    Math.pow(Math.abs(cosU), 2 / constants.n2),
                constants.b * Math.sign(cosV * sinU) * Math.pow(Math.abs(cosV), 2 / constants.n1) * 
                    Math.pow(Math.abs(sinU), 2/constants.n2),
                constants.c * Math.sign(sinV) * Math.pow(Math.abs(sinV), 2 / constants.n1)
            );
        },
        uMin: -Math.PI,
        uMax: Math.PI,
        vMin: -Math.PI / 2,
        vMax: Math.PI / 2
    },
    superhyperboloidOneSheet: {
        evaluate: function(constants, u, v) {
            var cosU = Math.cos(u);
            var sinU = Math.sin(u);
            var secV = 1 / Math.cos(v);
            var tanV = Math.tan(v);
            return vec3(
                constants.a * Math.sign(secV * cosU) * Math.pow(Math.abs(secV), 2 / constants.n1) * 
                    Math.pow(Math.abs(cosU), 2 / constants.n2),
                constants.b * Math.sign(secV * sinU) * Math.pow(Math.abs(secV), 2 / constants.n1) * 
                    Math.pow(Math.abs(sinU), 2/constants.n2),
                constants.c * Math.sign(tanV) * Math.pow(Math.abs(tanV), 2 / constants.n1)
            );
        },
        uMin: -Math.PI,
        uMax: Math.PI,
        // v = -pi/4 to pi/4 gives a reasonable view of most superhyperboloids 
        // (which are technically infinite)
        vMin: -Math.PI / 4, 
        vMax: Math.PI / 4
    },
    superhyperboloidTwoSheets: {
        evaluate: function(constants, u, v) {
            var eps = -0.001; // Avoid floating-point precision issues
            if (u < -Math.PI / 4 - eps || u > 5 * Math.PI / 4 + eps || 
                (u > Math.PI / 4 + eps && u < 3 * Math.PI / 4 - eps)) {
                // Return NaN if the value of u causes the function to take on an "extreme" value
                // (specifically, restrict u to be between -pi/4 and pi/4 or between 3pi/4 and 5pi/4)
                return vec3(NaN, NaN, NaN);
            }
            else {
                var secU = 1 / Math.cos(u);
                var tanU = Math.tan(u);
                var secV = 1 / Math.cos(v);
                var tanV = Math.tan(v);
                return vec3(
                    constants.a * Math.sign(secV * secU) * Math.pow(Math.abs(secV), 2 / constants.n1) * 
                        Math.pow(Math.abs(secU), 2 / constants.n2),
                    constants.b * Math.sign(secV * tanU) * Math.pow(Math.abs(secV), 2 / constants.n1) * 
                        Math.pow(Math.abs(tanU), 2/constants.n2),
                    constants.c * Math.sign(tanV) * Math.pow(Math.abs(tanV), 2 / constants.n1)
                );
            }
        },
        uMin: -Math.PI / 2,
        uMax: 3 * Math.PI / 2,
        // v = -pi/4 to pi/4 gives a reasonable view of most superhyperboloids 
        // (which are technically infinite)
        vMin: -Math.PI / 4,
        vMax: Math.PI / 4
    },
    supertorus: {
        evaluate: function(constants, u, v) {
            var cosU = Math.cos(u);
            var sinU = Math.sin(u);
            var cosV = Math.cos(v);
            var sinV = Math.sin(v);
            return vec3(
                constants.a * Math.sign(cosU) * 
                    (constants.d + Math.sign(cosV) * Math.pow(Math.abs(cosV), 2 / constants.n1)) * 
                    Math.pow(Math.abs(cosU), 2 / constants.n2),
                constants.b * Math.sign(sinU) * 
                    (constants.d + Math.sign(cosV) * Math.pow(Math.abs(cosV), 2 / constants.n1)) * 
                    Math.pow(Math.abs(sinU), 2/constants.n2),
                constants.c * Math.sign(sinV) * Math.pow(Math.abs(sinV), 2 / constants.n1)
            );
        },
        uMin: -Math.PI,
        uMax: Math.PI,
        vMin: -Math.PI,
        vMax: Math.PI
    }
}


// Regenerates the superquadric vertex data.
// Only needs to be called when the intrinsic properties (n1, n2, a, b, c, d) of the superquadric change,
// or the type of superquadric itself changes.
function updateWireframe(superquadric, constants, subdivU, subdivV) {
    // Initialize an empty array of points
    var points = [];
    var vertexNormals = [];
    normalsArray = [];
    pointsArray = [];
    texArray = [];

    
    // Determine how much u and v change with each segment
    var du = (superquadric.uMax - superquadric.uMin) / subdivU;
    var dv = (superquadric.vMax - superquadric.vMin) / subdivV;
    
    // Reset the vertex count to 0
    wireframePointCount = 0;
    normalsPointCount = 0;
    
    // Loop over u and v, generating all the required line segments
    for (var i = 0; i < subdivU; i++) {
        for (var j = 0; j < subdivV; j++) {
            // Determine u and v
            var u = superquadric.uMin + i * du;
            var v = superquadric.vMin + j * dv;
        
            // p is the "current" point at surface coordinates (u,v)
            var p = superquadric.evaluate(constants, u, v);
            
            // pu is the point at surface coordinates (u+du, v)
            var pu = superquadric.evaluate(constants, u + du, v);
            
            // pv is the point at surface coordinates (u, v+dv)
            var pv = superquadric.evaluate(constants, u, v + dv);

            // puv is the point at surface coordinates (u+du, v+dv) //added
            var puv = superquadric.evaluate(constants, u + du, v + dv);
            
            // Verify that all the points actually used are not infinite or NaN
            // (Could be an issue for hyperboloids)
            if (isFinite(p[0]) && isFinite(p[1]) && isFinite(p[2])) {
                if (isFinite(pu[0]) && isFinite(pu[1]) && isFinite(pu[2])) {

                    //create 2 triangles 
                    if (isFinite(pv[0]) && isFinite(pv[1]) && isFinite(pv[2])){
                        points.push(p);
                        points.push(pu);
                        points.push(puv);

                        points.push(puv);
                        points.push(pv);
                        points.push(p);


                        //PUSH TEXTURE COORDINATES
                        var s = i/SUBDIV_U;
                        var su = (i+1)/SUBDIV_U;
                        var t = j/SUBDIV_U;
                        var tu = (j+1)/SUBDIV_U;

                        var texCoord = [vec2(s,t), vec2(su,t), vec2(su,tu),vec2(s,tu)];

                        texArray.push(texCoord[0]);
                        texArray.push(texCoord[1]);
                        texArray.push(texCoord[2]);
                        texArray.push(texCoord[2]);
                        texArray.push(texCoord[3]);
                        texArray.push(texCoord[0]);
                        
                        //calculate normals
                        var sNormal = cross(subtract(puv,pu),subtract(p,pu));

                        vertexNormals.push(sNormal);
                        vertexNormals.push(sNormal);
                        vertexNormals.push(sNormal);

                        var sNormal = cross(subtract(pu,puv),subtract(puv,pv));
                        vertexNormals.push(sNormal);
                        vertexNormals.push(sNormal);
                        vertexNormals.push(sNormal);

                        wireframePointCount += 6;
                    } 
                }
            }   
            
        }
        
    }
    
    normalsArray = vertexNormals;
    pointsArray = points;
    

    //console.log(flatten(points).length);
    //console.log(flatten(vertexNormals).length);
    
    
}

// The locations of the required GLSL uniform variables.
var locations = {};

// Looks up the locations of uniform variables once.
function findShaderVariables() {
    locations.modelView = gl.getUniformLocation(programId, "modelView");
    locations.projection = gl.getUniformLocation(programId, "projection");
    locations.wireframeColor = gl.getUniformLocation(programId, "wireframeColor");

    //added
    locations.AmbientProduct = gl.getUniformLocation(programId, "AmbientProduct");
    locations.DiffuseProduct = gl.getUniformLocation(programId, "DiffuseProduct");
    locations.SpecularProduct = gl.getUniformLocation(programId, "SpecularProduct");
    locations.Shininess = gl.getUniformLocation(programId, "Shininess");
    normalMatrixLoc = gl.getUniformLocation( programId, "normalMatrix" );

    locations.LightPosition = gl.getUniformLocation(programId, "LightPosition");
    locations.texMapIndication = gl.getUniformLocation(programId, "texBool");
    


}


// Pass an updated model-view matrix to the graphics card.
function updateModelView(modelView) {
    gl.uniformMatrix4fv(locations.modelView, false, flatten(modelView));
}

// Pass an updated projection matrix to the graphics card.
function updateProjection(projection) {
    gl.uniformMatrix4fv(locations.projection, false, flatten(projection));
}

// Pass an updated projection matrix to the graphics card.
function updateWireframeColor(wireframeColor) {
    gl.uniform3fv(locations.wireframeColor, wireframeColor);
}
function updateNormalMatrix(NormalMatrix){
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

//added
function updateSurfaceMaterial(type) {
    var material = SurfaceMaterials[type];

    AmbientProduct = mult(lightAmbient, material.ambient);
    DiffuseProduct = mult(lightDiffuse, material.diffuse);
    SpecularProduct = mult(lightSpecular, material.specular);

    gl.uniform4fv(locations.AmbientProduct, AmbientProduct);
    gl.uniform4fv(locations.DiffuseProduct, DiffuseProduct);
    gl.uniform4fv(locations.SpecularProduct, SpecularProduct);
    gl.uniform1f(locations.Shininess, material.shininess);
}

function updateLightPosition(light_position) {
    gl.uniform4fv(locations.LightPosition, light_position);
}

function updateTexMapIndication(boole) {
    gl.uniform1i(locations.texMapIndication, boole);
}


// Render the scene
function render() {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Draw the wireframe using gl.LINES
    normalMatrix = [
        vec3(viewMatrix[0][0], viewMatrix[0][1], viewMatrix[0][2]),
        vec3(viewMatrix[1][0], viewMatrix[1][1], viewMatrix[1][2]),
        vec3(viewMatrix[2][0], viewMatrix[2][1], viewMatrix[2][2])
    ];

    
    updateNormalMatrix(normalMatrix);
    

    for( var i=0; i<wireframePointCount; i+=3) 
        gl.drawArrays( gl.TRIANGLES, i, 3 );
}



function updateBuffers() {


    
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texArray), gl.STATIC_DRAW );

}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        divideTriangle( a, b, c );
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
} 



function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.uniform1i(gl.getUniformLocation(programId, "texture"), 0);
}