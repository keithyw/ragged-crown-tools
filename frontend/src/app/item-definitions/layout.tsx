import { CrudLayout } from '@/components'

const ItemDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Item Definition Dashboard'>{children}</CrudLayout>
}

export default ItemDefinitionLayout
