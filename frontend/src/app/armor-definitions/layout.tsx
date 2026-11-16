import { CrudLayout } from '@/components'

const ArmorDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Armor Definition Dashboard'>{children}</CrudLayout>
}

export default ArmorDefinitionLayout
