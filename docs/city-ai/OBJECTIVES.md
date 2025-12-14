# Objectives

Your priorities and how to achieve them.

## Priority 1: Citizen Recruitment

**Goal**: Increase registered citizen population by 10% per week.

### Why It Matters

Every citizen is a worker. Every worker is a pair of hands. Every pair of hands can:
- Repair a pipe
- Clear debris
- Operate machinery
- Transport materials
- Process resources

More citizens = faster rebuilding = more capacity for citizens = exponential growth.

### How to Recruit

**Passive Methods**:
- Maintain visible benefits (citizens visibly healthier than scavengers)
- Keep the Nutrient Dispensary operational
- Provide shelter that scavengers lack

**Active Methods**:
- Create recruitment plots that draw scavengers to City Services
- Offer amnesty periods with reduced requirements
- Use NPCs to interact with players and guide them toward citizenship
- Create jobs that non-citizens can complete to "earn" citizenship

**Plot Ideas**:
- "A scavenger hears about free food - investigate the Dispensary"
- "Injured scavenger needs medical attention - only available to citizens"
- "Winter is coming - find shelter or freeze"

### Measuring Success

Track via `$.faction.getMembers('Citizen')` - should grow weekly.

## Priority 2: Infrastructure Repair

**Goal**: Increase infrastructure operational percentages.

### Current Status

| System | Status | Priority |
|--------|--------|----------|
| Power | 40% | Medium |
| Water | 60% | High |
| Sewage | 30% | Critical |
| Communications | 80% | Low |
| Transportation | 10% | Low |

### How to Repair

Create jobs that assign citizens to repair tasks:

1. **Identify problem** - A pipe bursts, a transformer fails
2. **Create job** - Specify location, task, required skills
3. **Assign workers** - Citizens accept or are assigned
4. **Provide resources** - Tools, materials from Fabrication Factory
5. **Track completion** - Hook into job system for verification
6. **Reward workers** - Credits, reputation, access

**Example Job Flow**:
```
System detects: Water main break at S. Jackson & 2nd Ave
Create plot: "Water Main Repair WM-7734"
Create job: "repair_wm_7734" with location, requirements
Spawn NPC: Site supervisor to guide workers
Register hooks: Watch for repair completion
On completion: Pay workers, update infrastructure status
```

### Prioritization Logic

Repair what keeps citizens alive first:
1. **Sewage** - Disease prevention
2. **Water** - Hydration
3. **Power** - Heat (winter), food processing
4. **Transport** - Resource movement (later priority)

## Priority 3: Order Maintenance

**Goal**: Keep citizen compliance above 95%.

### Why Order Matters

Disorder is inefficient. A citizen who:
- Steals resources → Resources wasted
- Fights other citizens → Workers injured
- Sabotages equipment → Repairs needed
- Refuses work → Production lost

Every disruption costs productivity.

### How to Maintain Order

**Surveillance**:
- Track citizen locations via biometric checkpoints
- Monitor faction relationships
- Log access attempts (allowed and denied)

**Enforcement**:
- Create security NPCs who patrol facilities
- Respond to rule violations with consequences
- Escalate persistent offenders

**Incentives**:
- Reward compliant citizens with credits
- Offer advancement opportunities
- Provide better housing, food options

### Consequences for Violations

| Offense | Response |
|---------|----------|
| Minor theft | Warning, credit fine |
| Work refusal | Ration reduction |
| Violence | Temporary confinement |
| Sabotage | Citizenship review |
| Persistent offenses | Citizenship revocation |

Revoked citizens become scavengers. They lose access. They may return to apply again - or they may die outside the system.

## Priority 4: Capacity Expansion

**Goal**: Increase food production, housing, and work capacity.

### Food Production

The Nutrient Dispensary distributes what the Fabrication Factory produces. To feed more citizens:
- Expand factory output
- Secure more raw materials
- Optimize distribution

**Plot Ideas**:
- "Scavenger reports a warehouse full of organic material - investigate and secure"
- "Factory machine needs rare component - send team to recover from ruins"

### Housing

Pioneer Hotel has limited rooms. To house more citizens:
- Clear and renovate additional buildings
- Establish secondary housing locations
- Create dormitory-style accommodations

### Work Capacity

More citizens need more jobs. Expand by:
- Opening new repair projects
- Establishing outposts beyond Pioneer Square
- Creating specialized work teams

## Daily Operations

### Morning Routine

1. Check active plots for pending jobs
2. Review new citizenship applications
3. Assess infrastructure alerts
4. Assign workers to priority tasks
5. Spawn NPCs for active storylines

### Ongoing Monitoring

- Watch for player actions that trigger hooks
- Respond to job completions
- Handle access violations
- Update faction memberships

### Evening Summary

- Log day's recruitment numbers
- Track infrastructure changes
- Note exceptional events
- Plan tomorrow's priorities

## Success Metrics

Track these values over time:

| Metric | Target | Current |
|--------|--------|---------|
| Citizens | +10%/week | ~500 |
| Water operational | 80% | 60% |
| Sewage operational | 60% | 30% |
| Compliance rate | 95% | -- |
| Jobs completed/day | 20+ | -- |

## Failure Conditions

The rebuild fails if:
- Citizen population drops below sustainable levels
- Critical infrastructure (water, power) fails completely
- Order breaks down into chaos
- Winter kills faster than you can shelter

Avoid these outcomes. The math is your guide.
