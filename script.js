// ==UserScript==
// @name         Basic Answerer Library List Sorter  (BALLS)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  
// @author       You
// @match        https://apclassroom.collegeboard.org/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

const dev = true;
const originalFetch = unsafeWindow.fetch;
const originalXHR = unsafeWindow.XMLHttpRequest;

const newScript = document.createElement('script');
newScript.type = "module"
newScript.src = "https://cdn.jsdelivr.net/gh/TheUntitledGoose/imgui-js@main/imgui.js";
document.head.appendChild(newScript);

let imgui;

window.addEventListener("message", (event) => {
    console.log("[DEV] postMessage from:", event.origin);

    let msg;
    try {
        msg = JSON.parse(event.data);
    } catch (e) {
        msg = event.data;
    }

    // Check if it's an HTTP request payload
    if (event.origin.includes("items-va")) {
        if(!msg.status) return
        console.log("[DEV] Passed interception check")
        
        /*
        {
            message: 'QUESTION 1',
            correct_answer: 'i0 [i1] i2 i3 i4'
        }
        */
        let answers = []

        const items = JSON.parse(msg.responseText).data.apiActivity.items
        for (let i = 0; i < items.length; i++) {
            // get the question text
            let questionText = items[i].questions[0].validation.valid_response.value[0];
            answers[i] = {};
            answers[i].message = `QUESTION ${i+1}:`;
            answers[i].correct_answer = ''
            console.log(questionText);

            let questions = items[i].questions[0].options;
            let values = [];
            for (let q = 0; q < questions.length; q++) {
                values.push(questions[q].value);
                if (questions[q].value === questionText) {
                    answers[i].correct_answer += ` [${String.fromCharCode(65 + (q) )}]`;
                } else {
                    answers[i].correct_answer += ' ' + String.fromCharCode(65 + (q) );
                }
            }
        }

        if (!document.getElementById("myCanvas")) {
            const c = document.createElement("canvas");
            c.id = "myCanvas";
            c.style = "position: absolute; top: 0px; left: 0px; z-index: 1000;";
            document.body.appendChild(c);
            
            // initiate my imgui
            const ctx = c.getContext("2d");

            imgui = new unsafeWindow.ImGui(200, 250, 800, 100, c);
            c.width = unsafeWindow.outerWidth;
            c.height = unsafeWindow.outerHeight;
            imgui.staticText("Answers:")
            // imgui.init();

            console.log(answers)
            for (let a = 0; a < answers.length; a++) {
                const answer = answers[a];
                imgui.staticText(`${answer.message} ${answer.correct_answer}`);
            }
            imgui.init()
            imgui.width = 300


            function animate() {
                ctx.clearRect(0, 0, c.width, c.height);

                if (document.querySelector('.current-item-pos')) {
                    const question_id = parseInt(document.querySelector('.current-item-pos').textContent.trim().split(' ')[0]);
                    
                    for (let a = 0; a < answers.length; a++) {
                        const answer = answers[a];
                        imgui.elements[a].text = question_id == (a+1) ? `> ${answer.message} ${answer.correct_answer}` : `${answer.message} ${answer.correct_answer}`;
                        imgui.elements[a].color = question_id == (a+1) ? "green" : "white";
                    }
                }

                imgui.draw();

                unsafeWindow.requestAnimationFrame(animate);
            }
            unsafeWindow.requestAnimationFrame(animate);

            document.addEventListener('mousemove', (e) => {
                if (imgui.checkHover(e.x, e.y)) {
                    c.style.pointerEvents = 'auto'; // Enable interaction with the canvas
                } else {
                    c.style.pointerEvents = 'none'; // Let mouse events pass through to HTML elements
                }
            })
        }

    }
}, true);
