# Expert Note Landing Page - Design Plan

## Core Narrative

**The Thesis**: In the AI era, generation is abundant—evaluation is scarce. Expert Note captures the irreplaceable human capacity to *know what's good*.

---

## Design Philosophy

### Style Guidelines (Matching Expert Note System)
- Clean, minimal, professional
- Color palette: #1e293b (dark), #64748b (gray), #2563eb (blue accent)
- White/light gray backgrounds (#f8fafc)
- System font stack
- Subtle shadows, no harsh gradients
- **Elevated touches**: Smooth animations, thoughtful micro-interactions

### Visual Language
- Abstract geometric shapes (circles, nodes, connections)
- Subtle motion that reveals ideas progressively
- Data visualization aesthetic (not marketing aesthetic)
- Icons and diagrams over stock imagery

---

## Page Structure

### 1. Hero Section
**Headline**: "Your Expertise. Preserved. Amplified."

**Subheadline**: "In a world of infinite AI-generated content, the scarce resource is knowing what's good."

**Visual**: Animated node network showing:
- Left side: Overwhelming cloud of dots (AI generation → abundance)
- Center: Expert figure/lens filtering
- Right side: Organized, valuable knowledge emerging

**Animation**: On scroll, dots flow through the filter

---

### 2. The Problem Section
**Title**: "The Real Bottleneck Isn't Generation"

**Two-column comparison**:

| Before AI | After AI |
|-----------|----------|
| Hard to generate ideas | AI generates infinite ideas |
| Evaluation felt easy | Evaluation is the new challenge |
| Experts needed for creation | Experts needed for curation |

**Key stat callout**:
- "GenAI scores 99th percentile on creativity tests"
- "Yet it can't tell you if a research question is *interesting*"

**Animation**: Counter showing "ideas generated" rapidly increasing, while "valuable ideas" stays static until expert appears

---

### 3. What Experts Know (The Tacit Advantage)

**Title**: "Experts Don't Just Know More. They *Feel* What Works."

**Four scenario cards** (with subtle icons):

1. **Research Design**
   "Is this a good research question?"
   → Experts simulate how reviewers will react, feel the counterintuitive twist

2. **Writing Decisions**
   "Should I structure it this way or that way?"
   → Experts project how readers will experience the flow

3. **Strategic Feedback**
   "What should we focus on next?"
   → Experts anticipate market reception, stakeholder responses

4. **Quality Judgment**
   "Is this ready to ship?"
   → Experts sense the gap between competent and compelling

**Callout quote**:
> "The expert constructs a mental simulation of how the concept will unfold and derives an intuitive forecast of usefulness."

---

### 4. The Mechanism: Idea Projection

**Title**: "How Expert Judgment Actually Works"

**Animated diagram showing**:
```
New Idea → Expert Mind → Mental Simulation → Affective Signal → Decision
                ↓
        [Years of experience]
        [Embodied knowledge]
        [Pattern recognition]
```

**Key insight cards**:
- **AI looks backward** - Recognizes patterns from training data
- **Experts look forward** - Simulate futures that don't yet exist
- **The difference** - Knowing what *was* useful vs. what *will* resonate

---

### 5. How Expert Note Works

**Title**: "Capture What Experts Know. Before It's Lost."

**Animated pipeline** (horizontal flow, reveals on scroll):

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Expert    │ → │  Structured │ → │  Extracted  │ → │  AI Prompts │
│  Documents  │    │ Annotations │    │  Knowledge  │    │ That Think  │
│             │    │             │    │             │    │  Like You   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     ▼                   ▼                  ▼                   ▼
  PDFs, notes      MACRO (big ideas)    Structured         AI assistants
  interviews       MESO (evidence)      insights           with your
  methodologies    MICRO (specifics)    relationships      expertise
```

**Animation**: Each step lights up sequentially with content preview

---

### 6. Who This Is For

**Title**: "Built for People Who've Earned Their Judgment"

**Three persona cards**:

1. **Senior Researchers**
   - Years of methodological expertise
   - Know what makes research "interesting"
   - Want to train AI to think like them

2. **Domain Experts**
   - Deep contextual knowledge
   - Tacit understanding of quality
   - Need to scale their judgment

3. **Team Leaders**
   - Curated organizational wisdom
   - Standards and best practices
   - Want to onboard faster

---

### 7. The Stakes

**Title**: "Expert Knowledge Is Being Lost"

**Sobering statistics visualization**:
- 10,000 baby boomers retire daily
- Average tenure at companies declining
- Knowledge walks out the door

**Contrast**: "AI can generate. Only experts can evaluate. Expert Note captures what makes the difference."

---

### 8. Call to Action

**Clean, simple CTA section**:

**Headline**: "Transform Expertise into Assets"

**Subheadline**: "Start capturing what you know—before it's just in your head."

**Button**: "Get Started" (blue, clean)

---

## Animation & Interaction Details

### Scroll-triggered animations
1. Hero section: Node network activates on load
2. Problem section: Counter animation on viewport entry
3. Pipeline: Steps reveal sequentially on scroll
4. Scenario cards: Subtle fade-up on scroll

### Micro-interactions
- Cards lift slightly on hover (2px, subtle shadow)
- Buttons have smooth state transitions
- Sections fade in smoothly (no jarring appearance)

### Performance
- CSS animations only (no heavy JS libraries)
- Intersection Observer for scroll triggers
- requestAnimationFrame for smooth motion

---

## Color Usage

| Element | Color | Purpose |
|---------|-------|---------|
| Primary text | #1e293b | Dark, readable |
| Secondary text | #64748b | Supporting info |
| Background | #ffffff, #f8fafc | Clean, open |
| Accent | #2563eb | CTAs, important elements |
| MACRO | #dc2626 (red) | Big ideas |
| MESO | #d97706 (amber) | Evidence |
| MICRO | #059669 (green) | Specifics |
| Problem/abundance | #94a3b8 | Noise, clutter |

---

## Typography

- Headlines: 600-700 weight, 2rem-3rem
- Body: 400 weight, 1rem-1.125rem
- Captions: 0.875rem, #64748b
- Quote blocks: Italic, larger, left border

---

## Implementation Order

1. **HTML structure** - Semantic sections
2. **CSS styling** - Match Expert Note design system
3. **Animations** - Progressive enhancement
4. **Testing** - Cross-browser, performance

---

## Key Messages (Less Words, More Impact)

- "Generation is abundant. Evaluation is scarce."
- "Experts don't calculate. They *feel* what works."
- "AI looks backward. Experts look forward."
- "Capture what you know. Before it's lost."
- "Your expertise. Preserved. Amplified."

---

**Design Principle**: Every element should feel like it belongs in a research tool, not a marketing website. Professional, thoughtful, trustworthy.
