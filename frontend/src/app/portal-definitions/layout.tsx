import { CrudLayout } from '@/components'

const PortalDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Portal Definition Dashboard'>{children}</CrudLayout>
}

export default PortalDefinitionLayout
