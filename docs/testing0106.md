this is feedback based on test on 20260106

some are major issues that requires carefully optimization and fix, when fix, please do not patch the problems but think deeply of the root cause and improve the code base and funcationality

1. knolwedge part is not working... extract knowledge not working 
2. after create new md, not able to save - Unsaved
3. when insert comments, the cursor or pointer appleas to the end... it should stay in exact where it inserted
4. tag can add new tag
5. after insert comments, it should use color to show comments - current it is a bit difficult to find the comments - use different color render for display
6. extract knowledge - there is a prompt behind it which can be edited and when click extract knowledge - it should allow user to add some additional instructions along with pre-defined prompts
7. there are prompts which generated based on the knowledge - i see but it related to knowledge base - current is not working - but how to synthezie knowledge to create prompts - behind this there is a system prompt that guide llm to generate prompts which we need to edit and create different versions that we can select with customer instructions... do you understand - there are prompts to be generated from knowledge base and the true system prompts in this system that guide the llm to generate
7. knowledge base issues as - 

Runtime TypeError



Cannot read properties of undefined (reading 'length')
src/components/knowledge/KnowledgeCard.tsx (23:45) @ KnowledgeCard


  21 |
  22 |   // Preview text - first 150 characters of original content
> 23 |   const previewText = entry.originalContent.length > 150
     |                                             ^
  24 |     ? entry.originalContent.substring(0, 150) + '...'
  25 |     : entry.originalContent;
  26 |
Call Stack
16

Show 12 ignore-listed frame(s)
KnowledgeCard
src/components/knowledge/KnowledgeCard.tsx (23:45)
<unknown>
src/app/knowledge/page.tsx (284:13)
Array.map
<anonymous>
KnowledgeListPage
src/app/knowledge/page.tsx (283:28)

