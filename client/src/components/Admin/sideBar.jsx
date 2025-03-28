import { ChevronUp, Home, Inbox, Search, Settings, User2 } from "lucide-react"
// import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/sidebar"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdown-menu"
// // Menu items.
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const items = [
  {
    title: "Dashbord",
    url: "/admin/home",
    icon: Home,
  },
  {
    title: "Manage Account",
    url: "/admin/manage",
    icon: Inbox,
  },
  {
    title: "My Account",
    url: "/admin/account",
    icon: Settings,
  },
  
 

]

export default function SideBarComponent() {
  return (
    <SidebarProvider>
      <Sidebar variant='floating' collapsible='icon'>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className='font-bold  font-serif text-2xl'>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className='mt-4'>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}  className=' pl-0 ml-0 my-2'>
                    <SidebarMenuButton asChild>
                      <a href={item.url}  >
                      <item.icon    />
                        <span className="text-sm md:text-base font-bold">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="flex items-center">
                    <User2 /> 
                    <span className="ml-2">Username</span> 
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter> 
      </Sidebar>
    </SidebarProvider>
  )
}