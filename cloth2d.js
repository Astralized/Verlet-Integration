/*
Copyright (c) 2014 Astralized
https://github.com/Astralized
https://codepen.io/Astralized/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

canvas = document.getElementById('c');
ctx    = canvas.getContext('2d');

//settings
var physics_acc   = 3,
    tear_distance = 40,
    gravity       = 0.1,
    friction      = 0.99,
    cloth_width   = 100, //rows
    cloth_height  = 50, //rows
    cloth_size    = 5; //pixel

//arrays
var pointmass     = [],
    constraints   = [];

//random
var halfx         = canvas.width / 2,
    halfy         = canvas.height / 3,
    mouse         = {
              down: false,
              x: 0,
              y: 0,
              ox: 0,
              oy: 0,
              button: 0
            };

ctx.lineWidth     = 0.5;
ctx.strokeStyle   = "#222";

window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
};

function init() {

    //create top row
    for(y=halfy-(cloth_height*cloth_size/2);y<halfy+(cloth_height*cloth_size/2);y+= cloth_size) {
    
        for(x=halfx-(cloth_width*cloth_size/2);x<halfx+(cloth_width*cloth_size/2);x+= cloth_size) {
            create_pointmass(x, y);
        }
    }

    //create constraints based on distance
    for(i = 0; i < pointmass.length; i++) {
    
        for(c = i + 1; c < pointmass.length; c++) {
          
             dist = Math.sqrt(
                    Math.pow(pointmass[i][0] - pointmass[c][0], 2) 
                  + Math.pow(pointmass[i][1] - pointmass[c][1], 2));

             if(dist < cloth_size + 1) {
                 create_constraint(i,c);
             } 

        }
    }

    //mouse
    canvas.onmousemove = function(e) {
        mouse.ox = mouse.x;
        mouse.oy = mouse.y;
        mouse.x  = e.pageX - canvas.offsetLeft,
        mouse.y  = e.pageY - canvas.offsetTop;
        e.preventDefault();
    };

    canvas.onmousedown = function(e) {
        mouse.button = e.which;
        mouse.down   = true;
        e.preventDefault();
    };

    canvas.oncontextmenu = function(e) {
        e.preventDefault();
    };

    canvas.onmouseup = function(e) {
        mouse.down = false;
        e.preventDefault();
    };

    render()
}

function draw() {
    ctx.beginPath();
    for(i = 0; i < constraints.length; i++) {
        f = constraints[i][0];
        s = constraints[i][1];
        ctx.moveTo(pointmass[f][0], pointmass[f][1]);
        ctx.lineTo(pointmass[s][0], pointmass[s][1]);
    }
        ctx.stroke();
}

function update_pointmass() {

    for(i = 0; i < pointmass.length; i++) {

        x  = pointmass[i][0];
        y  = pointmass[i][1];
        ox = pointmass[i][2];
        oy = pointmass[i][3];

        dx = x - ox;
        dy = y - oy;

        if(i > cloth_width) {
            pointmass[i][2] = x;
            pointmass[i][3] = y;

            pointmass[i][0] = x + dx * friction;
            pointmass[i][1] = y + dy + gravity;
        } else {
            pointmass[i][0] = ox;
            pointmass[i][1] = oy;
        }
    }
}

function update_constraint() {

    for(i = 0; i < physics_acc; i++) {

        for(c = 0; c < constraints.length; c++) {

            c1    = pointmass[constraints[c][0]];
            c2    = pointmass[constraints[c][1]];

            diffx = c1[0] - c2[0];
            diffy = c1[1] - c2[1];

            dist  = Math.sqrt(diffx * diffx + diffy * diffy);

            diff  = (constraints[c][2] - dist) / dist;

            dx    = (c1[0] - c2[0]) * 0.5;
            dy    = (c1[1] - c2[1]) * 0.5;

            c1[0] = c1[0] + dx * diff;
            c1[1] = c1[1] + dy * diff;

            c2[0] = c2[0] - dx * diff;
            c2[1] = c2[1] - dy * diff; 

            if(dist > tear_distance) {
                constraints.splice(c, 1);
            }
        }
    }
}

function create_pointmass(x,y) {

    pointmass.push([x, y, x, y]);
}

function create_constraint(f,s) {

    constraints.push([f, s, Math.sqrt(
                            Math.pow((pointmass[f][0] - pointmass[s][0]), 2)
                          + Math.pow((pointmass[f][1] - pointmass[s][1]), 2)), 1])
}

function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update_mouse();
    update_pointmass();
    update_constraint();
    draw();

    requestAnimFrame(render);
}


window.onload = function() {

    init()
}

function update_mouse() {

    if(mouse.down == true) {
        for(i = 0; i < pointmass.length; i++) {
    
            dist = Math.sqrt(Math.pow((pointmass[i][0] - mouse.x), 2)
                           + Math.pow((pointmass[i][1] - mouse.y), 2));

            //move cloth
            if(dist < cloth_size * 5 && mouse.button == 1) {
                pointmass[i][2] = pointmass[i][2] - Math.min(1, (mouse.x - mouse.ox) / 10);
                pointmass[i][3] = pointmass[i][3] - Math.min(1, (mouse.y - mouse.oy) / 10);
            }

            //tear cloth
            if(dist < cloth_size + 1 && mouse.button == 3) {
                for(c = 0; c < constraints.length; c++) {
                    if(constraints[c][0] == i || constraints[c][1] == i) {
                        constraints.splice(c, 1);
                    }
                }
            }

        }
    }
}