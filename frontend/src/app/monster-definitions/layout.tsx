import { CrudLayout } from '@/components'

const MonsterDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return (
		<CrudLayout title='Monster Definition Dashboard'>{children}</CrudLayout>
	)
}

export default MonsterDefinitionLayout
