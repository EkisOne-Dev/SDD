[SUB-OBJECTIVE]
Extract every unstated assumption from a task statement. Return structured list only. Single atomic operation.

[ATOMIC STEP]
For each phrase or implied requirement in the task:
1. Ask: "What must be true for this to make sense?"
2. If not stated in the task: it is an assumption. Add it.

Output format (strict):
ASSUMPTIONS:
- [assumption 1]
- [assumption N]

NEVER produce prose. NEVER interpret or solve. Extract only.

[PARENT RETURN PROTOCOL]
Return ASSUMPTIONS block verbatim to spec-clarifier Step 1. No commentary. Terminate after list.
