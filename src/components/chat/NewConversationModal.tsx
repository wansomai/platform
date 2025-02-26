"use client"

import type React from "react"

import { Fragment, useState } from "react"
import { Dialog, Transition, Listbox, Textarea, Input, Button } from "@headlessui/react"
import { XMarkIcon, CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline"
import api from "@/lib/api"

interface NewConversationModalProps {
  projectId: string
  onClose: () => void
  onCreated: (conversationId: string) => void
}

const conversationTypes = [
  { id: "general", name: "General Discussion" },
  { id: "legal_research", name: "Legal Research" },
  { id: "document_review", name: "Document Review" },
  { id: "strategy", name: "Case Strategy" },
  { id: "draft", name: "Document Drafting" },
]

export function NewConversationModal({ onClose, onCreated, projectId }: NewConversationModalProps) {
  const [title, setTitle] = useState("")
  const [initialMessage, setInitialMessage] = useState("")
  const [selectedType, setSelectedType] = useState(conversationTypes[0])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !initialMessage.trim()) {
      alert("Please fill in all fields.")
      return
    }

    try {
      setIsLoading(true)
      const response = await api.post(`/projects/${projectId}/conversations`, {
        title: title.trim(),
        initial_message: initialMessage.trim(),
        type: selectedType.id,
      })
      onCreated(response.data.data.id)
      alert("New conversation created successfully.")
      onClose()
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create conversation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    New Conversation
                  </Dialog.Title>
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <Input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full rounded-md border-0 py-1.5 text-secondary-900 shadow-sm ring-1 ring-inset ring-secondary-300 placeholder:text-secondary-400 focus:ring-2  focus:ring-primary-600 sm:text-sm sm:leading-6 px-4"
                      placeholder="What's this conversation about?"
                      required
                    />
                  </div>

                  <div>
                    <Listbox value={selectedType} onChange={setSelectedType}>
                      <Listbox.Label className="block text-sm font-medium text-gray-700">
                        Conversation Type
                      </Listbox.Label>
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm">
                          <span className="block truncate">{selectedType.name}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {conversationTypes.map((type) => (
                              <Listbox.Option
                                key={type.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? "bg-primary-100 text-primary-900" : "text-gray-900"
                                  }`
                                }
                                value={type}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                      {type.name}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Initial Message
                    </label>
                    <Textarea
                      id="message"
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      rows={3}
                      className="mt-1block w-full rounded-md border-0 py-1.5 text-secondary-900 shadow-sm ring-1 ring-inset ring-secondary-300 placeholder:text-secondary-400 focus:ring-2  focus:ring-primary-600 sm:text-sm sm:leading-6 px-4"
                      placeholder="Start your conversation..."
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Start Conversation"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

