import { CrudLayout } from '@/components'

const TileDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Tile Definition Dashboard'>{children}</CrudLayout>
}

export default TileDefinitionLayout
