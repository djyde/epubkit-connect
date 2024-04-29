import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import '../style.css'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

export function Providers(props: {
  children: React.ReactNode
}) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </>
  )
}