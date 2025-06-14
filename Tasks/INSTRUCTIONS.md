We're implementing unit tests one by one.
Everytime, I'll first tell you which tests to implement.
DO NOT move on to the next test yourself unless I tell you to.
Always come back and check with me first.

- First read @/Tasks/testing_implementation_checklist.md.
- Then read @/Tasks/note_to_agent.md to read the important notes for the agent from the previous agents.

The procedure is:
1. Implement the test
2. Run the e2e test and make sure it passes.
3. Run previous tests:
- a. Run unit tests: npm run test
- b. Use browser action on port 3000 to test there's no error. The dev server is already running: http://localhost:3000 and http://localhost:3000/?settings=true

Make sure by the end, check that all tests pass at the same time.

4. Update the checklist.
5. Update @/Tasks/note_to_agent.md with any learnings you have from this task which you think will be useful for the next agent.

Task: Implement [TASK_NUMBER]