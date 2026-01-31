import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ProjectContextType {
  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_ID_KEY = "current_project_id";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProjectId, setCurrentProjectIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(PROJECT_ID_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  const setCurrentProjectId = (id: number | null) => {
    setCurrentProjectIdState(id);
    if (id !== null) {
      localStorage.setItem(PROJECT_ID_KEY, id.toString());
    } else {
      localStorage.removeItem(PROJECT_ID_KEY);
    }
  };

  return (
    <ProjectContext.Provider value={{ currentProjectId, setCurrentProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
