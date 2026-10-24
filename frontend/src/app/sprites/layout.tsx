import { CrudLayout } from '@/components'

const SpriteLayout = ({
	children,
}: Readonly<{ children: React.ReactNode }>) => {
	return <CrudLayout title='Sprite Dashboard'>{children}</CrudLayout>
}

export default SpriteLayout
