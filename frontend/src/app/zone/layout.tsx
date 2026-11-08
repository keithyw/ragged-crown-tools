import { CrudLayout } from '@/components'
import { URLS } from '@/lib/constants'

const LINKS = [
	{ href: URLS.ZONE, label: 'Zones' },
	{ href: URLS.ZONE_SPECS, label: 'Zone Specs' },
	{ href: URLS.ZONE_REVIEW, label: 'Review Generated Zones' },
]

const ZoneLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return (
		<CrudLayout title='Zone/Map Dashboard' links={LINKS}>
			{children}
		</CrudLayout>
	)
}

export default ZoneLayout
