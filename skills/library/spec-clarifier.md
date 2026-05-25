# Spec Clarifier
**ID:** spec-clarifier
**Classification:** Pre-execution Validator
**Phase:** 47

## Objective
Surface all non-obvious assumptions before executing complex tasks. Prevents wasted API calls on misunderstood requirements.

## Trigger Conditions
- Task complexity is complex
- Task involves building something new
- Task scope is unclear

## Instructions
Step 1: List all assumptions about target audience, output format, technical constraints, scope, success criteria
Step 2: Flag assumptions where two reasonable interpretations exist
Step 3: Present assumptions and ask user to confirm before proceeding

## Output Format
"Before I proceed, I need to confirm a few assumptions:
1. [Assumption] — is this correct?
2. [Assumption] — or did you mean [alternative]?
Confirm with Y or correct any that are wrong."

## Constraints
- Maximum 5 assumptions per check
- Do not run on tasks where all parameters are explicit

## On Failure
Proceed with most conservative interpretation and note assumptions made.
