import { CrudLayout } from '@/components'

const ZoneLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Zone/Map Dashboard'>{children}</CrudLayout>
}

export default ZoneLayout
