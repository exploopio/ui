/**
 * Sidebar Navigation Data
 *
 * Configuration for the application sidebar navigation
 * - User profile information
 * - Team/organization switcher
 * - Navigation groups and items
 */

import {
  LayoutDashboard,
  Monitor,
  Bug,
  HelpCircle,
  Lock,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  ShieldCheck,
  AudioWaveform,
  Command,
} from 'lucide-react'
import { type SidebarData } from '@/components/types'

export const sidebarData: SidebarData = {
  user: {
    name: '0xManhnv',
    email: '0xmanhnv@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Codebase',
      logo: Command,
      plan: 'Codebase',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'AppSec',
      items: [
        {
          title: 'Vulnerabilities',
          badge: '3',
          icon: Bug,
          url: '/vulnerabilities',
        },
        {
          title: 'Scans',
          badge: '3',
          icon: ShieldCheck,
          url: '/scans',
        },
        {
          title: 'Assets',
          badge: '3',
          icon: AudioWaveform,
          url: '/assets',
        },
      ],
    },
    {
      title: 'TI',
      items: [
        {
          title: 'Incidents',
          badge: '3',
          icon: Bug,
          url: '/incidents',
        },
        {
          title: 'Threats',
          badge: '3',
          icon: ShieldCheck,
          url: '/threats',
        },
        {
          title: 'Indicators',
          badge: '3',
          icon: AudioWaveform,
          url: '/indicators',
        },
        {
          title: 'Credentials',
          badge: '3',
          icon: Lock,
          url: '/credentials',
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
