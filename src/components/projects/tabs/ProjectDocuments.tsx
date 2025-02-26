const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.length) return
  
  setIsUploading(true)
  setUploadError('')
  
  try {
    const file = e.target.files[0]
    // Add your file upload logic here
    
  } catch (error) {
    setUploadError('Failed to upload file')
  } finally {
    setIsUploading(false)
  }
} 