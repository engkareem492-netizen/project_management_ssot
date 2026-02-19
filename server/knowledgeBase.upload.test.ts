import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as storage from "./storage";

// Mock the storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

describe("Knowledge Base File Upload", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: Context;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock context with authenticated user
    mockContext = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "email",
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  it("should upload file and return URL", async () => {
    // Mock storagePut to return a URL
    const mockUrl = "https://s3.example.com/kb-attachments/project-1/12345-test.pdf";
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: "kb-attachments/project-1/12345-test.pdf",
      url: mockUrl,
    });

    // Create base64 encoded test data
    const testData = "Test file content";
    const base64Data = Buffer.from(testData).toString("base64");

    // Call the uploadFile mutation
    const result = await caller.knowledgeBase.uploadFile({
      projectId: 1,
      fileName: "test.pdf",
      fileData: base64Data,
      mimeType: "application/pdf",
    });

    // Verify the result
    expect(result).toEqual({ url: mockUrl });

    // Verify storagePut was called with correct parameters
    expect(storage.storagePut).toHaveBeenCalledTimes(1);
    const [fileKey, buffer, mimeType] = vi.mocked(storage.storagePut).mock.calls[0];
    
    // Check file key format
    expect(fileKey).toMatch(/^kb-attachments\/project-1\/\d+-test\.pdf$/);
    
    // Check buffer content
    expect(buffer.toString()).toBe(testData);
    
    // Check mime type
    expect(mimeType).toBe("application/pdf");
  });

  it("should sanitize file names with special characters", async () => {
    const mockUrl = "https://s3.example.com/kb-attachments/project-1/12345-test_file.pdf";
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: "kb-attachments/project-1/12345-test_file.pdf",
      url: mockUrl,
    });

    const base64Data = Buffer.from("test").toString("base64");

    await caller.knowledgeBase.uploadFile({
      projectId: 1,
      fileName: "test file!@#$%.pdf",
      fileData: base64Data,
      mimeType: "application/pdf",
    });

    // Verify file name was sanitized
    const [fileKey] = vi.mocked(storage.storagePut).mock.calls[0];
    expect(fileKey).toMatch(/test_file_____\.pdf$/);
  });

  it("should handle different file types", async () => {
    const mockUrl = "https://s3.example.com/kb-attachments/project-1/12345-image.png";
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: "kb-attachments/project-1/12345-image.png",
      url: mockUrl,
    });

    const base64Data = Buffer.from("fake image data").toString("base64");

    const result = await caller.knowledgeBase.uploadFile({
      projectId: 1,
      fileName: "image.png",
      fileData: base64Data,
      mimeType: "image/png",
    });

    expect(result).toEqual({ url: mockUrl });
    
    const [, , mimeType] = vi.mocked(storage.storagePut).mock.calls[0];
    expect(mimeType).toBe("image/png");
  });

  it("should include project ID in file path", async () => {
    const mockUrl = "https://s3.example.com/kb-attachments/project-99/12345-doc.docx";
    vi.mocked(storage.storagePut).mockResolvedValue({
      key: "kb-attachments/project-99/12345-doc.docx",
      url: mockUrl,
    });

    const base64Data = Buffer.from("document content").toString("base64");

    await caller.knowledgeBase.uploadFile({
      projectId: 99,
      fileName: "doc.docx",
      fileData: base64Data,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const [fileKey] = vi.mocked(storage.storagePut).mock.calls[0];
    expect(fileKey).toContain("project-99");
  });

  it("should propagate storage errors", async () => {
    // Mock storagePut to throw an error
    vi.mocked(storage.storagePut).mockRejectedValue(new Error("S3 upload failed"));

    const base64Data = Buffer.from("test").toString("base64");

    // Expect the mutation to throw
    await expect(
      caller.knowledgeBase.uploadFile({
        projectId: 1,
        fileName: "test.pdf",
        fileData: base64Data,
        mimeType: "application/pdf",
      })
    ).rejects.toThrow("S3 upload failed");
  });
});
