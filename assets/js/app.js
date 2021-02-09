// Define UI Variables 
const taskInput = document.querySelector('#task'); //the task input text field
const form = document.querySelector('#task-form'); //The form at the top
const filter = document.querySelector('#filter'); //the task filter text field
const taskList = document.querySelector('.collection'); //The UL
const clearBtn = document.querySelector('.clear-tasks'); //the all task clear button

const reloadIcon = document.querySelector('.fa'); //the reload button at the top navigation 
let sortBy = document.querySelector('#sortby');

//DB variable 

let DB;
let taskObjects = Array();



function paintUI(taskObjectsL, ascending=true){
    taskList.innerText = '';
    for (value in taskObjectsL){
        if (ascending === false){
            value = taskObjectsL.length - value - 1
        }
        // Create an li element when the user adds a task 
        const li = document.createElement('li');
        //add Attribute for delete 
        li.setAttribute('data-task-id', taskObjectsL[value]['id']);
        // Adding a class
        li.className = 'collection-item row';
        // Create text node and append it 
        const text = document.createElement('div')
        text.innerText = taskObjectsL[value]['taskname']
        text.className = "col s5"
        li.appendChild(text);
        //create date and append to li
        const date = document.createElement('div');
        date.className = "col s5"
        date.innerText = `${taskObjectsL[value]['date'][2]} - ${taskObjectsL[value]['date'][1]} - ${taskObjectsL[value]['date'][0]}  ${taskObjectsL[value]['date'][3]}:${taskObjectsL[value]['date'][4]}:${taskObjectsL[value]['date'][5]}`;
        li.appendChild(date)
        // Create new element for the link 
        const link = document.createElement('a');
        // Add class and the x marker for a 
        link.className = 'delete-item secondary-content col s1';
        link.innerHTML = `
        <i class="fa fa-remove"></i>
        &nbsp;
        <a href="../edit.html?id=${taskObjectsL[value]['id']}"><i class="fa fa-edit"></i> </a>
        `;
        // Append link to li
        li.appendChild(link);
        // Append to UL 
        taskList.appendChild(li);
    }
}

// Add Event Listener [on Load]
document.addEventListener('DOMContentLoaded', () => {
    // create the database
    let TasksDB = indexedDB.open('tasks', 1);

    // if there's an error
    TasksDB.onerror = function() {
            console.log('There was an error');
        }
        // if everything is fine, assign the result to the instance
    TasksDB.onsuccess = function() {
        // console.log('Database Ready');

        // save the result
        DB = TasksDB.result;

        // display the Task List 
        displayTaskList();
    }

    // This method runs once (great for creating the schema)
    TasksDB.onupgradeneeded = function(e) {
        // the event will be the database
        let db = e.target.result;

        // create an object store, 
        // keypath is going to be the Indexes
        let objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });

        // createindex: 1) field name 2) keypath 3) options
        objectStore.createIndex('taskname', 'taskname', { unique: false });

        console.log('Database ready and fields created!');
    }

    form.addEventListener('submit', addNewTask);

    function addNewTask(e) {
        e.preventDefault();

        // Check empty entry
        if (taskInput.value === '') {
            taskInput.style.borderColor = "red";
            return;
        }

        // create a new object with the form info
        let newTask = {
            time : Date.now(),
            taskname: taskInput.value,
            date : [(new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate(), (new Date()).getHours(), (new Date()).getMinutes(),(new Date()).getSeconds()]
        }

        // Insert the object into the database 
        let transaction = DB.transaction(['tasks'], 'readwrite');
        let objectStore = transaction.objectStore('tasks');

        let request = objectStore.add(newTask);

        // on success
        request.onsuccess = () => {
            form.reset();
        }
        transaction.oncomplete = () => {
            console.log('New appointment added');
            displayTaskList();
        }
        transaction.onerror = () => {
            console.log('There was an error, try again!');
        }

    }

    function displayTaskList() {
        // clear the previous task list
        taskObjects = []
        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }

        // create the object store
        let objectStore = DB.transaction('tasks').objectStore('tasks');
        objectStore.openCursor().onsuccess = function(e) {
            // assign the current cursor
            let cursor = e.target.result;
            if (cursor) {
                taskObjects.push(cursor.value)
                // console.log(taskObjects)
                cursor.continue();
            }
            paintUI(taskObjects, sortBy.value=='ascending'?true:false);
        }
    }

    // Remove task event [event delegation]
    taskList.addEventListener('click', removeTask);

    function removeTask(e) {

        if (e.target.parentElement.classList.contains('delete-item')) {
            if (confirm('Are You Sure about that ?')) {
                // get the task id
                let taskID = Number(e.target.parentElement.parentElement.getAttribute('data-task-id'));
                // use a transaction
                let transaction = DB.transaction(['tasks'], 'readwrite');
                let objectStore = transaction.objectStore('tasks');
                objectStore.delete(taskID);
                displayTaskList();
                transaction.oncomplete = () => {
                    e.target.parentElement.parentElement.remove();
                }

            }

        }

    }

    //clear button event listener   
    clearBtn.addEventListener('click', clearAllTasks);

    //clear tasks 
    function clearAllTasks() {
        let transaction = DB.transaction("tasks", "readwrite");
        let tasks = transaction.objectStore("tasks");
        // clear the table.
        tasks.clear();
        taskObjects = []
        displayTaskList();
        console.log("Tasks Cleared !!!");
    }
});

//updating ui every time the order by drop down changed
sortBy.addEventListener('change', ()=>{paintUI(taskObjects, sortBy.value=='ascending'?true:false)});