#!/usr/bin/expect -f

set timeout 60
spawn cre init

# Nombre del proyecto (usar default: my-project)
expect {
    "Project name? *my-project*:" {
        send "\r"
        exp_continue
    }
    "Project name? *" {
        send "my-project\r"
        exp_continue
    }
}

# Seleccionar TypeScript (flecha abajo para ir de Golang a TypeScript)
expect {
    "What language do you want to use?" {
        sleep 1
        send "\033\[B"  # Flecha abajo (mover de Golang a TypeScript)
        sleep 0.5
        send "\r"       # Presionar Enter para confirmar TypeScript
        exp_continue
    }
    "language" {
        sleep 1
        send "\033\[B"
        sleep 0.5
        send "\r"
        exp_continue
    }
}

# Esperar y seleccionar el template Hello World
expect {
    "Pick a workflow template" {
        sleep 1
        # Para TypeScript, Hello World suele ser el primero
        # Si no, necesitamos navegar con flechas
        send "\r"  # Seleccionar el primero (Hello World para TypeScript)
        exp_continue
    }
    "workflow template" {
        sleep 1
        send "\r"
        exp_continue
    }
}

# Nombre del workflow
expect {
    "Workflow name? *my-workflow*:" {
        send "\r"
        exp_continue
    }
    "Workflow name? *" {
        send "my-workflow\r"
        exp_continue
    }
}

# Esperar a que termine
expect {
    eof {}
    timeout { send_user "Comando completado\n" }
}

