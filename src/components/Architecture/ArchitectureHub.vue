<template>
  <div class="container">
    <div class="architecture-content">
      <header class="mb-8">
        <p class="kicker">
          Protocol Workspace
        </p>
        <h1 class="title">
          {{ architectureMeta.title }}
        </h1>
        <p class="subtitle">
          {{ architectureMeta.subtitle }}
        </p>
        <p class="updated-at">
          Last updated: {{ architectureMeta.updatedAt }}
        </p>
      </header>

      <section class="section">
        <h2 class="section-title">
          Source Of Truth
        </h2>
        <div class="panel">
          <p class="panel-copy">
            Keep the editable architecture draft in
            <code>src/architecture/architecturePlan.js</code>. Keep long-form
            protocol references in <code>docs/modular-staking/architecture.md</code>
            and <code>docs/modular-staking/diagrams.md</code>.
          </p>
          <div class="links">
            <a
              v-for="source in architectureMeta.sources"
              :key="source"
              :href="source"
              target="_blank"
              rel="noopener noreferrer"
              class="doc-link"
            >
              {{ source }}
            </a>
          </div>
          <p class="panel-copy mt-12">
            Local planning docs:
          </p>
          <div class="local-docs">
            <code
              v-for="doc in architectureMeta.localDocs"
              :key="doc"
            >{{
              doc
            }}</code>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          Core Architecture Snapshot
        </h2>
        <div class="grid">
          <article
            v-for="item in coreArchitecture"
            :key="item.title"
            class="card"
          >
            <h3 class="card-title">
              {{ item.title }}
            </h3>
            <ul class="bullet-list">
              <li
                v-for="point in item.points"
                :key="point"
              >
                {{ point }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          Protocol Diagrams
        </h2>
        <div class="diagram-stack">
          <article
            v-for="diagram in architectureDiagrams"
            :key="diagram.title"
            class="diagram-panel"
          >
            <div class="diagram-copy">
              <h3 class="card-title">
                {{ diagram.title }}
              </h3>
              <p class="goal">
                {{ diagram.summary }}
              </p>
            </div>
            <div class="diagram-grid">
              <div
                v-for="group in diagram.groups"
                :key="group.label"
                class="diagram-group"
              >
                <span class="diagram-label">{{ group.label }}</span>
                <span
                  v-for="node in group.nodes"
                  :key="node"
                  class="diagram-node"
                >{{ node }}</span>
              </div>
            </div>
            <ol class="flow-list">
              <li
                v-for="flow in diagram.flows"
                :key="flow"
              >
                {{ flow }}
              </li>
            </ol>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          Governed Module Rollout
        </h2>
        <div class="grid rollout-grid">
          <article
            v-for="stage in governedRollout"
            :key="stage.stage"
            class="card"
          >
            <p class="kicker compact-kicker">
              {{ stage.owner }}
            </p>
            <h3 class="card-title">
              {{ stage.stage }}
            </h3>
            <ul class="bullet-list">
              <li
                v-for="control in stage.controls"
                :key="control"
              >
                {{ control }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          Phased Evolution Roadmap
        </h2>
        <div class="roadmap">
          <article
            v-for="phase in phaseRoadmap"
            :key="phase.phase"
            class="phase"
          >
            <div class="phase-header">
              <span class="phase-badge">{{ phase.phase }}</span>
              <h3 class="phase-title">
                {{ phase.name }}
              </h3>
            </div>
            <ul class="bullet-list">
              <li
                v-for="item in phase.additions"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          PR 379 Release Readiness
        </h2>
        <div class="checklist">
          <article
            v-for="item in contractV1Readiness"
            :key="item.title"
            class="checklist-item"
          >
            <div class="checklist-header">
              <span
                class="status-pill"
                :class="statusClass(item.status)"
              >{{
                statusLabel(item.status)
              }}</span>
              <h3 class="checklist-title">
                {{ item.title }}
              </h3>
            </div>
            <p class="goal">
              {{ item.goal }}
            </p>
            <p class="state">
              <strong>Current state:</strong> {{ item.currentState }}
            </p>
            <p class="next-step">
              <strong>Next step:</strong> {{ item.nextStep }}
            </p>
            <ul class="bullet-list">
              <li
                v-for="task in item.tasks"
                :key="task"
              >
                {{ task }}
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">
          Release Tracks
        </h2>
        <div class="grid">
          <article
            v-for="track in releaseTracks"
            :key="track.milestone"
            class="card"
          >
            <h3 class="card-title">
              {{ track.milestone }}
            </h3>
            <ul class="bullet-list">
              <li
                v-for="criterion in track.criteria"
                :key="criterion"
              >
                {{ criterion }}
              </li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import {
  architectureMeta,
  coreArchitecture,
  phaseRoadmap,
  contractV1Readiness,
  architectureDiagrams,
  governedRollout,
  releaseTracks,
} from "@/architecture/architecturePlan";

export default {
  name: "ArchitectureHub",
  data() {
    return {
      architectureMeta,
      coreArchitecture,
      phaseRoadmap,
      contractV1Readiness,
      architectureDiagrams,
      governedRollout,
      releaseTracks,
    };
  },
  methods: {
    statusLabel(status) {
      if (status === "in_progress") return "In Progress";
      if (status === "done") return "Done";
      return "Todo";
    },
    statusClass(status) {
      if (status === "in_progress") return "status-in-progress";
      if (status === "done") return "status-done";
      return "status-todo";
    },
  },
};
</script>

<style scoped>
.container {
  background-color: rgb(24, 24, 24);
  width: 92%;
  max-width: 1200px;
  margin: auto;
  margin-bottom: 24px;
  padding-top: 132px;
  padding-bottom: 32px;
}

.architecture-content {
  color: #e8eef7;
  overflow-wrap: anywhere;
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #7aa2ff;
  margin-bottom: 8px;
}

.title {
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 700;
  color: #ffffff;
}

.subtitle {
  margin-top: 8px;
  color: #b7c4dc;
  max-width: 780px;
}

.updated-at {
  margin-top: 8px;
  color: #7f92b1;
  font-size: 0.9rem;
}

.section {
  margin-top: 28px;
}

.section-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
}

.panel {
  background: #1b2230;
  border: 1px solid #2b3a52;
  border-radius: 10px;
  padding: 14px;
}

.panel-copy {
  color: #cbd8ed;
  margin-bottom: 10px;
}

.mt-12 {
  margin-top: 12px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.doc-link {
  font-size: 0.85rem;
  color: #8cb2ff;
  text-decoration: underline;
  text-underline-offset: 2px;
  word-break: break-all;
}

.local-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.card,
.phase,
.checklist-item {
  background: #1b2230;
  border: 1px solid #2b3a52;
  border-radius: 10px;
  padding: 14px;
  min-width: 0;
}

.roadmap,
.checklist,
.diagram-stack {
  display: grid;
  gap: 12px;
}

.diagram-panel {
  background: #1b2230;
  border: 1px solid #2b3a52;
  border-radius: 10px;
  padding: 14px;
  min-width: 0;
}

.diagram-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.diagram-group {
  min-height: 132px;
  border: 1px solid #31435f;
  background: #131b2a;
  border-radius: 8px;
  padding: 10px;
  display: grid;
  align-content: start;
  gap: 8px;
}

.diagram-label {
  color: #8cb2ff;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.diagram-node {
  display: block;
  color: #edf4ff;
  background: #22314a;
  border: 1px solid #3d5272;
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.flow-list {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  color: #d4deef;
  padding-left: 20px;
}

.flow-list li {
  line-height: 1.45;
}

.compact-kicker {
  margin-bottom: 6px;
}

.card-title,
.phase-title,
.checklist-title {
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
}

.phase-header,
.checklist-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.phase-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f1729;
  background: #7aa2ff;
  border-radius: 999px;
  padding: 3px 8px;
}

.status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 3px 8px;
}

.status-todo {
  background: #3b2a2a;
  color: #ffc9c9;
}

.status-in-progress {
  background: #2f3621;
  color: #d7f2a6;
}

.status-done {
  background: #1f3a2a;
  color: #9ff0c6;
}

.goal {
  margin-top: 8px;
  color: #b7c4dc;
}

.state,
.next-step {
  margin-top: 8px;
  color: #d4deef;
}

.bullet-list {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  color: #d4deef;
  padding-left: 18px;
}

.bullet-list li {
  line-height: 1.45;
}

code {
  background: #111724;
  color: #c0cff0;
  border: 1px solid #26334a;
  border-radius: 4px;
  padding: 2px 4px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media only screen and (max-width: 900px) {
  .container {
    width: 95%;
    padding-top: 118px;
  }

  .title {
    font-size: 1.65rem;
  }

  .section-title {
    font-size: 1.2rem;
  }
}
</style>
