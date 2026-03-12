import { createContext, useContext, useState, useCallback } from 'react'

type ContactState = {
  isOpen: boolean
  openContact: () => void
  closeContact: () => void
}

const ContactContext = createContext<ContactState | undefined>(undefined)

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const openContact = useCallback(() => setIsOpen(true), [])
  const closeContact = useCallback(() => setIsOpen(false), [])
  const value = { isOpen, openContact, closeContact }
  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  )
}

export function useContact() {
  const ctx = useContext(ContactContext)
  if (!ctx) throw new Error('useContact must be used within ContactProvider')
  return ctx
}
