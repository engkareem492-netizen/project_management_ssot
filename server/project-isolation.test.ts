import { describe, it, expect, beforeAll } from "vitest";
import {
  getAllRequirements,
  getAllTasks,
  getAllIssues,
  getAllDependencies,
  getAllAssumptions,
  getAllDeliverables,
  getAllStakeholders,
  createRequirement,
  createTask,
  createIssue,
  createDependency,
  createAssumption,
  createDeliverable,
  createStakeholder,
  getDeliverablesByEntity,
  getRequirementWithLinkedItems,
} from "./db";

describe("Project Data Isolation", () => {
  let project1Id = 1;
  let project2Id = 2;
  let req1Id: string;
  let req2Id: string;
  let deliverable1Id: number;
  let deliverable2Id: number;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Create test data for project 1
    const req1 = await createRequirement({
      projectId: project1Id,
      idCode: `ISO-TEST-${timestamp}-001`,
      description: "Project 1 Requirement",
      status: "Open",
      priority: "High",
      type: "Functional",
      category: "Feature",
      owner: "Owner 1",
      ownerId: 1,
    });
    req1Id = req1?.idCode || `ISO-TEST-${timestamp}-001`;

    await createTask({
      projectId: project1Id,
      taskId: `ISO-TSK-${timestamp}-001`,
      description: "Project 1 Task",
      requirementId: req1Id,
      status: "Open",
      priority: "High",
      responsible: "Responsible 1",
      responsibleId: 1,
    });

    await createIssue({
      projectId: project1Id,
      issueId: `ISO-ISS-${timestamp}-001`,
      description: "Project 1 Issue",
      requirementId: req1Id,
      status: "Open",
      priority: "High",
      owner: "Owner 1",
      ownerId: 1,
    });

    const del1 = await createDeliverable({
      projectId: project1Id,
      deliverableId: `ISO-DEL-${timestamp}-001`,
      description: "Project 1 Deliverable",
      status: "Pending",
      type: "Document",
    });
    deliverable1Id = del1.id;

    await createDependency({
      projectId: project1Id,
      dependencyId: `ISO-DEP-${timestamp}-001`,
      description: "Project 1 Dependency",
      status: "Open",
    });

    await createAssumption({
      projectId: project1Id,
      assumptionId: `ISO-ASM-${timestamp}-001`,
      description: "Project 1 Assumption",
      status: "Valid",
    });

    await createStakeholder({
      projectId: project1Id,
      fullName: "Project 1 Stakeholder",
      role: "Manager",
    });

    // Create test data for project 2
    const req2 = await createRequirement({
      projectId: project2Id,
      idCode: `ISO-TEST-${timestamp}-002`,
      description: "Project 2 Requirement",
      status: "Open",
      priority: "High",
      type: "Functional",
      category: "Feature",
      owner: "Owner 2",
      ownerId: 2,
    });
    req2Id = req2?.idCode || `ISO-TEST-${timestamp}-002`;

    await createTask({
      projectId: project2Id,
      taskId: `ISO-TSK-${timestamp}-002`,
      description: "Project 2 Task",
      requirementId: req2Id,
      status: "Open",
      priority: "High",
      responsible: "Responsible 2",
      responsibleId: 2,
    });

    await createIssue({
      projectId: project2Id,
      issueId: `ISO-ISS-${timestamp}-002`,
      description: "Project 2 Issue",
      requirementId: req2Id,
      status: "Open",
      priority: "High",
      owner: "Owner 2",
      ownerId: 2,
    });

    const del2 = await createDeliverable({
      projectId: project2Id,
      deliverableId: `ISO-DEL-${timestamp}-002`,
      description: "Project 2 Deliverable",
      status: "Pending",
      type: "Document",
    });
    deliverable2Id = del2.id;

    await createDependency({
      projectId: project2Id,
      dependencyId: `ISO-DEP-${timestamp}-002`,
      description: "Project 2 Dependency",
      status: "Open",
    });

    await createAssumption({
      projectId: project2Id,
      assumptionId: `ISO-ASM-${timestamp}-002`,
      description: "Project 2 Assumption",
      status: "Valid",
    });

    await createStakeholder({
      projectId: project2Id,
      fullName: "Project 2 Stakeholder",
      role: "Manager",
    });
  });

  it("should only return requirements from specified project", async () => {
    const project1Reqs = await getAllRequirements(project1Id);
    const project2Reqs = await getAllRequirements(project2Id);

    const project1Ids = project1Reqs.map((r) => r.idCode);
    const project2Ids = project2Reqs.map((r) => r.idCode);

    expect(project1Ids).toContain(req1Id);
    expect(project1Ids).not.toContain(req2Id);
    expect(project2Ids).toContain(req2Id);
    expect(project2Ids).not.toContain(req1Id);
  });

  it("should only return tasks from specified project", async () => {
    const project1Tasks = await getAllTasks(project1Id);
    const project2Tasks = await getAllTasks(project2Id);

    const project1Ids = project1Tasks.map((t) => t.taskId);
    const project2Ids = project2Tasks.map((t) => t.taskId);

    expect(project1Ids).toContain(`ISO-TSK-${timestamp}-001`);
    expect(project1Ids).not.toContain(`ISO-TSK-${timestamp}-002`);
    expect(project2Ids).toContain(`ISO-TSK-${timestamp}-002`);
    expect(project2Ids).not.toContain(`ISO-TSK-${timestamp}-001`);
  });

  it("should only return issues from specified project", async () => {
    const project1Issues = await getAllIssues(project1Id);
    const project2Issues = await getAllIssues(project2Id);

    const project1Ids = project1Issues.map((i) => i.issueId);
    const project2Ids = project2Issues.map((i) => i.issueId);

    expect(project1Ids).toContain(`ISO-ISS-${timestamp}-001`);
    expect(project1Ids).not.toContain(`ISO-ISS-${timestamp}-002`);
    expect(project2Ids).toContain(`ISO-ISS-${timestamp}-002`);
    expect(project2Ids).not.toContain(`ISO-ISS-${timestamp}-001`);
  });

  it("should only return deliverables from specified project", async () => {
    const project1Deliverables = await getAllDeliverables(project1Id);
    const project2Deliverables = await getAllDeliverables(project2Id);

    const project1Ids = project1Deliverables.map((d) => d.deliverableId);
    const project2Ids = project2Deliverables.map((d) => d.deliverableId);

    expect(project1Ids).toContain(`ISO-DEL-${timestamp}-001`);
    expect(project1Ids).not.toContain(`ISO-DEL-${timestamp}-002`);
    expect(project2Ids).toContain(`ISO-DEL-${timestamp}-002`);
    expect(project2Ids).not.toContain(`ISO-DEL-${timestamp}-001`);
  });

  it("should only return dependencies from specified project", async () => {
    const project1Dependencies = await getAllDependencies(project1Id);
    const project2Dependencies = await getAllDependencies(project2Id);

    const project1Ids = project1Dependencies.map((d) => d.dependencyId);
    const project2Ids = project2Dependencies.map((d) => d.dependencyId);

    expect(project1Ids).toContain(`ISO-DEP-${timestamp}-001`);
    expect(project1Ids).not.toContain(`ISO-DEP-${timestamp}-002`);
    expect(project2Ids).toContain(`ISO-DEP-${timestamp}-002`);
    expect(project2Ids).not.toContain(`ISO-DEP-${timestamp}-001`);
  });

  it("should only return assumptions from specified project", async () => {
    const project1Assumptions = await getAllAssumptions(project1Id);
    const project2Assumptions = await getAllAssumptions(project2Id);

    const project1Ids = project1Assumptions.map((a) => a.assumptionId);
    const project2Ids = project2Assumptions.map((a) => a.assumptionId);

    expect(project1Ids).toContain(`ISO-ASM-${timestamp}-001`);
    expect(project1Ids).not.toContain(`ISO-ASM-${timestamp}-002`);
    expect(project2Ids).toContain(`ISO-ASM-${timestamp}-002`);
    expect(project2Ids).not.toContain(`ISO-ASM-${timestamp}-001`);
  });

  it("should only return stakeholders from specified project", async () => {
    const project1Stakeholders = await getAllStakeholders(project1Id);
    const project2Stakeholders = await getAllStakeholders(project2Id);

    const project1Names = project1Stakeholders.map((s) => s.fullName);
    const project2Names = project2Stakeholders.map((s) => s.fullName);

    expect(project1Names).toContain("Project 1 Stakeholder");
    expect(project1Names).not.toContain("Project 2 Stakeholder");
    expect(project2Names).toContain("Project 2 Stakeholder");
    expect(project2Names).not.toContain("Project 1 Stakeholder");
  });

  it("should not return deliverables from other projects via getDeliverablesByEntity", async () => {
    // This test verifies the critical fix - getDeliverablesByEntity should filter by projectId
    const project1Deliverables = await getDeliverablesByEntity("requirement", req1Id, project1Id);
    const project1Ids = project1Deliverables.map((d) => d.id);

    // Should not include deliverables from project 2
    expect(project1Ids).not.toContain(deliverable2Id);
  });

  it("should only return linked items from same project in getRequirementWithLinkedItems", async () => {
    const req1Data = await getRequirementWithLinkedItems(req1Id);
    
    if (req1Data) {
      const taskIds = req1Data.tasks.map((t) => t.taskId);
      const issueIds = req1Data.issues.map((i) => i.issueId);

      // Should only contain project 1 items
      expect(taskIds).toContain(`ISO-TSK-${timestamp}-001`);
      expect(taskIds).not.toContain(`ISO-TSK-${timestamp}-002`);
      expect(issueIds).toContain(`ISO-ISS-${timestamp}-001`);
      expect(issueIds).not.toContain(`ISO-ISS-${timestamp}-002`);
    }
  });
});
