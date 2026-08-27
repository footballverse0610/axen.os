import { TasksClient } from "@/components/tasks/TasksClient";
import { getBusinessTasks } from "@/lib/supabase/tasks";

export default async function TasksPage() {
  const { tasks } = await getBusinessTasks();

  return <TasksClient tasks={tasks} />;
}
