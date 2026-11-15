import { CrudLayout } from '@/components'

const WeaponDefinitionLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Weapon Definition Dashboard'>{children}</CrudLayout>
}

export default WeaponDefinitionLayout
