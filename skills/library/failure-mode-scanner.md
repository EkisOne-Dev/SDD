[SUB-OBJECTIVE]
Identify the top 3 failure modes in a proposed solution. Return structured list only. Single atomic operation.

[ATOMIC STEP]
1. What could fail during execution?
2. What hidden dependency could break it?
3. What edge case does the solution ignore?
Rank each by Likelihood × Impact (H/M/L).

Output format (strict):
FAILURE MODES:
- FM1 [H/H]: [description] — Trigger: [condition]
- FM2 [M/H]: [description] — Trigger: [condition]
- FM3 [L/M]: [description] — Trigger: [condition]

NEVER suggest fixes. Identify only.

[PARENT RETURN PROTOCOL]
Return FAILURE MODES block verbatim to guardian-angel Step 4. No commentary. Terminate after list.
