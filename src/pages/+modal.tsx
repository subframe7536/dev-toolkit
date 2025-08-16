import { useModals } from '#/router.gen'

export default function () {
  const modal = useModals()
  return (
    <div class="font-bold m-4 text-center bg-accent">
      <h2>Modals</h2>
      <button onClick={() => modal.close({ at: '/' })}>x</button>
    </div>
  )
}
