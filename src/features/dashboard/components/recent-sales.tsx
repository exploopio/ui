/**
 * Recent Sales Component
 *
 * Displays list of recent sales transactions
 * - Shows avatar, name, email, and amount
 * - Mock data for demonstration (should be replaced with real API data)
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// MOCK DATA - Replace with real API integration (see docs/API_INTEGRATION.md)
const salesData = [
  {
    id: '1',
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    avatar: '/avatars/01.png',
    initials: 'OM',
    amount: '+$1,999.00',
  },
  {
    id: '2',
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    avatar: '/avatars/02.png',
    initials: 'JL',
    amount: '+$39.00',
  },
  {
    id: '3',
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    avatar: '/avatars/03.png',
    initials: 'IN',
    amount: '+$299.00',
  },
  {
    id: '4',
    name: 'William Kim',
    email: 'will@email.com',
    avatar: '/avatars/04.png',
    initials: 'WK',
    amount: '+$99.00',
  },
  {
    id: '5',
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    avatar: '/avatars/05.png',
    initials: 'SD',
    amount: '+$39.00',
  },
]

export function RecentSales() {
  return (
    <div className='space-y-8'>
      {salesData.map((sale) => (
        <div key={sale.id} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarImage src={sale.avatar} alt={sale.name} />
            <AvatarFallback>{sale.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{sale.name}</p>
              <p className='text-muted-foreground text-sm'>{sale.email}</p>
            </div>
            <div className='font-medium'>{sale.amount}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
