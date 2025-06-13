We're implementing unit tests one by one.
Everytime, I'll first tell you which tests to implement.
DO NOT move on to the next test yourself unless I tell you to.
Always come back and check with me first.
First read @/Tasks/testing_implementation_checklist.md.
Then read @/Tasks/note_to_agent.md.

The procedure is:
1. Implement the test
2. Run test and make sure it passes: npm run test
3. Use browser action on port 3000 to test there's no error. The dev server is already running.
- a. Open the browser and go to http://localhost:3000
- b. Open the browser and go to http://localhost:3000/?settings=true

Make sure by the end, check that both 2 and 3 pass.

4. Update the checklist.
5. Update @/Tasks/note_to_agent.md with any learnings you have from this task which you think will be useful for the next agent.
5. Generate the next task using new_task tool by copying the template from @/Tasks\INSTRUCTIONS.md and updating the task number. The task should be exactly the same as the template. DO NOT ADD CONTEXTS or any other information.

Task: Implement [TASK_NUMBER]