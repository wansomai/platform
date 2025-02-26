export function ProjectInstructions({ projectId }: { projectId: string }) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900">Case Instructions</h3>
          <button className="text-primary-600 hover:text-primary-700">
            Edit
          </button>
        </div>
        <div className="flex-1 p-4">
          {/* Instructions content */}
          <div className="prose prose-sm max-w-none">
            <h4>Case Overview</h4>
            <p>Description of the case and key objectives...</p>
            
            <h4>Key Documents</h4>
            <ul>
              <li>Initial complaint</li>
              <li>Evidence exhibits</li>
              <li>Expert testimonies</li>
            </ul>
  
            <h4>Timeline</h4>
            <p>Important dates and deadlines...</p>
  
            <h4>Special Instructions</h4>
            <p>Specific handling instructions or requirements...</p>
          </div>
        </div>
      </div>
    )
  }