import { CrudLayout } from '@/components'

const ObjectDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Object Definition Dashboard'>{children}</CrudLayout>
}

export default ObjectDefinitionLayout
