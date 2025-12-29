# Gap Analysis & Agent Prompt Engineering Methodology

**Document Purpose:** This document provides a comprehensive methodology for conducting gap analysis and engineering effective agent prompts for technical projects. Based on analysis of three pull requests (PRs 104, 112, 113) that created gap analysis documents for an Aztec liquid staking protocol.

**Status:** Reference Document / Template  
**Last Updated:** December 29, 2025

**Key Improvements:**
- Enhanced prompt structure with clearer context, constraints, and success criteria
- Cross-referenced dependencies between gaps
- Added metrics and KPIs for each gap
- Improved execution prioritization with parallelization opportunities
- Meta-prompt for creating gap analyses

---

## Meta-Prompt: Gap Analysis Creation Agent

```
You are a strategic planning expert specializing in comprehensive gap analysis for technical projects. Your task is to create a thorough gap analysis document that identifies all missing components, dependencies, and risks for a project.

**Your Process:**

1. **Discovery Phase**
   - Review all existing documentation (README, architecture docs, implementation plans, task lists)
   - Identify what exists vs. what's missing
   - Categorize gaps by domain (technical, legal, operational, business)
   - Map dependencies between gaps

2. **Prioritization Framework**
   - P0 (Critical/Blocker): Must fix before next milestone
   - P1 (High): Must fix before launch
   - P2 (Medium): Should fix before launch
   - P3 (Low): Can address post-launch
   
   Consider:
   - Impact on project success
   - Dependencies (what blocks what)
   - Time to resolution
   - Resource requirements

3. **Gap Documentation Structure**
   For each gap, document:
   - **ID**: Unique identifier (GAP-XXX)
   - **Title**: Clear, descriptive name
   - **Priority**: P0/P1/P2/P3
   - **Impact**: What happens if not addressed
   - **Current State**: What exists now (with references)
   - **Missing Items**: Specific checklist of what's needed
   - **Dependencies**: What other gaps this depends on
   - **Success Criteria**: How to know it's complete
   - **Metrics**: KPIs to track progress
   - **Agent Prompt**: Reference to specialized prompt (PROMPT-XXX)

4. **Agent Prompt Engineering**
   For each gap requiring specialized work, create a detailed prompt:
   - **Role Definition**: Who the agent is (expert type)
   - **Context**: Project background, constraints, current state
   - **Deliverables**: Specific outputs with file paths
   - **Constraints**: Technical, legal, resource limitations
   - **Success Criteria**: Acceptance criteria
   - **Time Estimate**: Realistic time estimate
   - **Dependencies**: What must exist first

5. **Execution Planning**
   - Identify parallelization opportunities
   - Create dependency graph
   - Suggest execution order
   - Identify critical path

**Output Format:**
- Markdown document with clear sections
- Tables for status tracking
- Checklists for deliverables
- Cross-references between gaps and prompts
- Execution timeline

**Quality Checklist:**
- [ ] All gaps have unique IDs
- [ ] Each gap has clear success criteria
- [ ] Dependencies are mapped
- [ ] Prompts are specific and actionable
- [ ] Time estimates are realistic
- [ ] Critical path is identified
```

---

## Enhanced Gap Analysis Structure

### Gap Entry Template

```markdown
#### GAP-XXX: [Clear Title]
**Priority:** P0/P1/P2/P3
**Category:** Technical | Legal | Operations | Business | Security
**Impact:** [Quantified impact statement]
**Dependencies:** GAP-YYY, GAP-ZZZ (must complete first)
**Blocks:** GAP-AAA, GAP-BBB (blocks these)

**Current State:**
- [Specific reference to existing docs/code]
- [What exists now]
- [Completeness %]

**Missing Items:**
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2
- [ ] Specific deliverable 3

**Success Criteria:**
- [ ] Criterion 1 (measurable)
- [ ] Criterion 2 (measurable)
- [ ] Criterion 3 (measurable)

**Metrics & KPIs:**
- Metric 1: Target value
- Metric 2: Target value

**Agent Prompt:** See PROMPT-XXX
**Estimated Resolution Time:** X hours/days
**Resource Requirements:** [Team members, budget, tools]
```

---

## Improved Agent Prompt Template

```markdown
## PROMPT-XXX: [Agent Role] Agent

```
You are a [specific expert type] specializing in [domain]. [Your mission statement].

**Project Context:**
- [High-level project description]
- [Current phase/milestone]
- [Relevant constraints]

**Current State:**
- [What exists now]
- [What's been attempted]
- [Known issues/limitations]

**Your Deliverables:**

1. **[File Path]** - [Document Name]
   - [Specific content requirements]
   - [Format requirements]
   - [Success criteria]

2. **[File Path]** - [Document Name]
   - [Specific content requirements]
   - [Format requirements]
   - [Success criteria]

**Constraints:**
- [Technical constraints]
- [Resource constraints]
- [Time constraints]
- [Legal/regulatory constraints]

**Dependencies:**
- Requires: [What must exist first]
- Integrates with: [What this connects to]

**Key Questions to Answer:**
- [Question 1]
- [Question 2]
- [Question 3]

**Success Criteria:**
- [ ] Deliverable 1 meets acceptance criteria
- [ ] Deliverable 2 meets acceptance criteria
- [ ] All questions answered
- [ ] Documentation complete and reviewed

**Output Format:** [Markdown/Code/Diagrams/etc.]

**Time Estimate:** X-Y hours
**Priority:** [If urgent]

**References:**
- [Link to relevant docs]
- [Link to related gaps]
- [Link to examples/templates]
```

---

## Enhanced Execution Planning

### Dependency Graph Visualization

```
GAP-001 (Legal Entity) ──┐
                          ├──> GAP-011 (Risk Quantification)
GAP-002 (Security) ──────┤
                          │
GAP-003 (Key Management) ─┘
                          │
                          ├──> GAP-008 (Smart Contracts)
                          │
GAP-004 (Frontend) ───────┼──> GAP-012 (SDK)
                          │
GAP-005 (Integrations) ───┘
```

### Parallelization Opportunities

**Week 1 (Parallel):**
- Legal Agent (PROMPT-001) - Long lead time, start immediately
- Integration Research (PROMPT-005) - No dependencies
- Contract Development (PROMPT-008) - Technical blocker

**Week 2 (Parallel):**
- Security Agent (PROMPT-002) - Requires GAP-001 partial completion
- Key Management (PROMPT-003) - Requires GAP-001 partial completion
- Operations Agent (PROMPT-007) - Can start with assumptions

**Week 3-4 (Sequential):**
- Frontend Agent (PROMPT-004) - Requires GAP-008 completion
- SDK Agent (PROMPT-012) - Requires GAP-008 completion

### Critical Path Analysis

**Critical Path (Longest):**
1. Legal Entity Formation (GAP-001) - 4-6 weeks
2. Risk Quantification (GAP-011) - Requires legal structure - 1 week
3. Fundraising Prep - 1 week
**Total: 6-8 weeks**

**Technical Critical Path:**
1. Contract Completion (GAP-008) - 2-3 weeks
2. Frontend Development (GAP-004) - 2 weeks
3. Integration Testing - 1 week
**Total: 5-6 weeks**

---

## Metrics & Success Tracking

### Gap Completion Metrics

| Gap ID | Priority | Status | % Complete | Days Remaining | Blocker? |
|--------|----------|--------|------------|----------------|----------|
| GAP-001 | P0 | 🔴 Not Started | 5% | 42 | Yes |
| GAP-002 | P0 | 🔴 Not Started | 0% | 14 | Yes |
| GAP-003 | P0 | 🔴 Not Started | 0% | 7 | Yes |
| GAP-008 | P1 | 🟡 In Progress | 50% | 14 | Yes |

### Overall Project Health

**Completeness by Category:**
- Legal/Regulatory: 5% (1/20 items)
- Security: 40% (8/20 items)
- Technical: 50% (4/7 contracts)
- Operations: 10% (2/20 items)
- Business: 20% (4/20 items)

**Risk Score:** 🔴 High (Critical gaps unaddressed)

---

## Improvements Over Original PRs

### What Was Good (Preserve)
1. ✅ Comprehensive gap identification (15+ gaps)
2. ✅ Clear prioritization (P0/P1/P2)
3. ✅ Detailed agent prompts with context
4. ✅ Execution recommendations
5. ✅ Verification checklist

### What Was Improved
1. ✅ **Added dependency mapping** - Clear what blocks what
2. ✅ **Enhanced prompt structure** - More specific, actionable
3. ✅ **Added success criteria** - Measurable completion criteria
4. ✅ **Added metrics/KPIs** - Track progress quantitatively
5. ✅ **Better cross-references** - Easier navigation
6. ✅ **Critical path analysis** - Identify bottlenecks
7. ✅ **Parallelization opportunities** - Faster execution
8. ✅ **Meta-prompt** - Template for creating gap analyses

### What Was Added
1. ✅ **Gap entry template** - Standardized format
2. ✅ **Agent prompt template** - Consistent structure
3. ✅ **Dependency graph** - Visual representation
4. ✅ **Metrics dashboard** - Progress tracking
5. ✅ **Resource requirements** - Budget/time planning

---

## Best Practices for Gap Analysis

### 1. Discovery Phase
- **Review comprehensively**: Don't skip documentation
- **Interview stakeholders**: Get different perspectives
- **Check competitors**: Learn from others' gaps
- **Validate assumptions**: Verify what you think exists

### 2. Categorization
- **Use consistent categories**: Technical, Legal, Operations, Business, Security
- **Don't mix concerns**: Keep categories separate
- **Use subcategories**: When needed for clarity

### 3. Prioritization
- **Be honest**: Don't mark everything P0
- **Consider dependencies**: What blocks what
- **Think timeline**: What must happen first
- **Consider impact**: What breaks if missing

### 4. Prompt Engineering
- **Be specific**: Vague prompts = vague results
- **Provide context**: Agent needs background
- **Define deliverables**: Clear outputs expected
- **Set constraints**: Realistic limitations
- **Include examples**: Show desired format

### 5. Execution Planning
- **Identify parallel work**: Don't serialize unnecessarily
- **Map dependencies**: Know what blocks what
- **Track critical path**: Focus on bottlenecks
- **Update regularly**: Gaps change as project evolves

---

## Example: Enhanced Gap Entry

#### GAP-001: Legal Entity & Regulatory Strategy
**Priority:** P0 - Blocker
**Category:** Legal/Regulatory
**Impact:** Cannot accept investment without entity. Blocks fundraising milestone.
**Dependencies:** None (foundational)
**Blocks:** GAP-011 (Risk Quantification), Fundraising milestone

**Current State:**
- Brief mention in `docs/FUNDRAISING.md`: "Delaware C-Corp"
- No entity formed
- No legal structure decision
- Completeness: 5%

**Missing Items:**
- [ ] Entity structure decision matrix (C-Corp vs Foundation vs DAO LLC)
- [ ] Jurisdiction analysis (Delaware, Wyoming, Cayman, BVI)
- [ ] Token legal classification analysis (is stAZTEC a security?)
- [ ] OFAC/AML compliance framework for privacy chain
- [ ] Terms of Service draft (v1.0)
- [ ] Privacy Policy draft (v1.0)
- [ ] Securities law opinion (for institutional investors)
- [ ] Entity formation documents
- [ ] Registered agent selection
- [ ] Tax structure analysis

**Success Criteria:**
- [ ] Entity formed and registered
- [ ] Legal opinion obtained (written)
- [ ] Terms of Service finalized (legal review complete)
- [ ] Privacy Policy finalized (legal review complete)
- [ ] Compliance framework documented and approved
- [ ] Can accept investment (legally cleared)

**Metrics & KPIs:**
- Entity formation time: Target < 6 weeks
- Legal opinion cost: Target < $25k
- Document completeness: 100% of required docs

**Agent Prompt:** See PROMPT-001
**Estimated Resolution Time:** 4-6 weeks
**Resource Requirements:** Legal counsel ($15k-$25k), Executive time (20 hours)

---

## Example: Enhanced Agent Prompt

## PROMPT-001: Legal & Regulatory Strategy Agent

```
You are a legal strategy consultant specializing in crypto/DeFi startups. Create a comprehensive legal and regulatory framework for an Aztec Network liquid staking protocol (stAZTEC).

**Project Context:**
- Seed-stage startup raising $500k-$750k
- Building liquid staking protocol on Aztec Network (privacy-focused L2)
- Target launch: 6 months
- Need to accept investment and operate legally

**Current State:**
- Brief mention in `docs/FUNDRAISING.md`: "Delaware C-Corp"
- No entity formed
- No legal structure analysis
- No compliance framework
- No legal opinions obtained

**Your Deliverables:**

1. **docs/LEGAL_ENTITY_ANALYSIS.md** - Entity structure decision
   - Comparison matrix: C-Corp vs Foundation vs DAO LLC
   - Jurisdiction analysis: Delaware, Wyoming, Cayman, BVI
   - Recommendation with rationale
   - Formation timeline and costs
   - Tax implications

2. **docs/TOKEN_LEGAL_ANALYSIS.md** - Token classification
   - Is stAZTEC a security? (Howey test analysis)
   - Regulatory considerations (SEC, CFTC)
   - Privacy chain implications
   - Recommendations for compliance
   - Risk assessment

3. **docs/COMPLIANCE_FRAMEWORK.md** - Compliance strategy
   - OFAC/AML requirements for privacy chain
   - KYC/AML procedures (if needed)
   - Sanctions screening process
   - Record-keeping requirements
   - Reporting obligations

4. **docs/TERMS_OF_SERVICE.md** - Terms of Service draft
   - User agreements
   - Liability limitations
   - Dispute resolution
   - Privacy disclosures
   - Risk disclosures

5. **docs/PRIVACY_POLICY.md** - Privacy Policy draft
   - Data collection practices
   - Privacy chain considerations
   - User rights
   - Cookie/tracking disclosures
   - GDPR compliance (if applicable)

6. **docs/LEGAL_OPINION_REQUIREMENTS.md** - Opinion requirements
   - What opinions are needed
   - When they're needed
   - Estimated costs
   - Recommended law firms
   - Timeline

**Constraints:**
- Budget: $15k-$25k for legal work
- Timeline: 4-6 weeks
- Must be investor-ready
- Must support privacy-focused protocol
- Must be scalable (future DAO transition)

**Dependencies:**
- None (foundational work)
- Will inform: GAP-011 (Risk Quantification)

**Key Questions to Answer:**
- What entity structure minimizes legal risk while enabling investment?
- Is stAZTEC a security? What are the implications?
- How do we comply with OFAC/AML on a privacy chain?
- What legal opinions do investors require?
- How do we structure for future DAO transition?

**Success Criteria:**
- [ ] Entity structure decision made with rationale
- [ ] Token classification analysis complete
- [ ] Compliance framework documented
- [ ] Terms of Service draft ready for legal review
- [ ] Privacy Policy draft ready for legal review
- [ ] Legal opinion requirements documented
- [ ] All questions answered
- [ ] Budget and timeline estimates provided

**Output Format:** Markdown documents with tables, decision matrices, and clear recommendations

**Time Estimate:** 4-6 weeks (with legal counsel)
**Priority:** P0 - Critical blocker

**References:**
- `docs/FUNDRAISING.md` - Current mentions
- `docs/ECONOMICS.md` - Token economics
- `docs/ASSUMPTIONS.md` - Regulatory assumptions
- Example: Lido DAO legal structure
- Example: Rocket Pool legal structure
```

---

## Conclusion

This improved template demonstrates:

1. **Better Structure**: Clear templates for gaps and prompts
2. **Enhanced Context**: More background for agents
3. **Measurable Success**: Clear criteria and metrics
4. **Dependency Management**: Know what blocks what
5. **Execution Planning**: Critical path and parallelization
6. **Continuous Improvement**: Track progress with metrics

**Next Steps:**
1. Use this template for future gap analyses
2. Customize templates for your domain
3. Build tooling to track gap completion
4. Create agent prompt library for reuse

---

**Document Version:** 2.0 (Improved)
**Based On:** Analysis of PRs 104, 112, 113
**Created:** December 29, 2025
**Status:** Template/Reference Document
